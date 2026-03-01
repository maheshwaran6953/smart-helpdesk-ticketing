const db = require('../config/db');
const { calculateBreachRisk } = require('../utils/predictiveEngine');

const runSLACheck = async () => {
  console.log('Running SLA escalation check...');

  try {

    // ─────────────────────────────────────────────
    // PART 1 — Original SLA breach escalation logic
    // ─────────────────────────────────────────────
    const [breachedTickets] = await db.execute(`
      SELECT t.*, u.name AS user_name
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.status IN ('open', 'in_progress')
      AND t.sla_deadline < NOW()
      AND t.is_escalated = 0
    `);

    if (breachedTickets.length === 0) {
      console.log('No SLA breaches found.');
    } else {
      console.log(`Found ${breachedTickets.length} SLA breached ticket(s)`);

      const [admins] = await db.execute(
        'SELECT id FROM users WHERE role = ?', ['admin']
      );

      for (const ticket of breachedTickets) {
        await db.execute(
          'UPDATE tickets SET is_escalated = 1 WHERE id = ?',
          [ticket.id]
        );

        await db.execute(`
          INSERT INTO ticket_logs 
          (ticket_id, changed_by, old_status, new_status, note)
          VALUES (?, ?, ?, ?, ?)`,
          [ticket.id, admins[0].id, ticket.status, ticket.status, 'Auto escalated — SLA breached']
        );

        for (const admin of admins) {
          await db.execute(
            'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
            [admin.id, `SLA BREACHED — Ticket #${ticket.id}: "${ticket.title}" has exceeded its deadline`]
          );
        }

        if (ticket.agent_id) {
          await db.execute(
            'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
            [ticket.agent_id, `URGENT — Ticket #${ticket.id}: "${ticket.title}" has breached SLA. Please resolve immediately.`]
          );
        }

        console.log(`Ticket #${ticket.id} escalated successfully`);
      }
    }

    // ─────────────────────────────────────────────
    // PART 2 — Calculate breach risk for ALL open tickets
    // ─────────────────────────────────────────────
    const [openTickets] = await db.execute(`
      SELECT * FROM tickets
      WHERE status IN ('open', 'in_progress')
    `);

    if (openTickets.length > 0) {
      console.log(`Calculating breach risk for ${openTickets.length} open ticket(s)...`);

      for (const ticket of openTickets) {
        const { score, reason } = await calculateBreachRisk(ticket);

        await db.execute(
          'UPDATE tickets SET breach_risk = ?, breach_risk_reason = ? WHERE id = ?',
          [score, reason, ticket.id]
        );
      }

      console.log('Breach risk scores updated for all open tickets.');
    }

    // ─────────────────────────────────────────────
    // PART 3 — Warn admins about HIGH breach risk tickets (>= 80)
    // ─────────────────────────────────────────────
    const [highRiskTickets] = await db.execute(`
      SELECT * FROM tickets
      WHERE status IN ('open', 'in_progress')
      AND breach_risk >= 80
    `);

    if (highRiskTickets.length > 0) {
      console.log(`Found ${highRiskTickets.length} high breach risk ticket(s)`);

      const [admins] = await db.execute(
        'SELECT id FROM users WHERE role = ?', ['admin']
      );

      for (const ticket of highRiskTickets) {
        for (const admin of admins) {
          const [existing] = await db.execute(`
            SELECT id FROM notifications
            WHERE user_id = ?
            AND message LIKE ?
            AND created_at >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)
          `, [admin.id, `%BREACH RISK%Ticket #${ticket.id}%`]);

          if (existing.length === 0) {
            await db.execute(
              'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
              [admin.id, `⚠️ BREACH RISK ${ticket.breach_risk}% — Ticket #${ticket.id}: "${ticket.title}" is at critical risk of SLA breach`]
            );
          }
        }
      }
    }

    // ─────────────────────────────────────────────
    // PART 4 — Auto-redistribution (breach risk >= 80%)
    // ─────────────────────────────────────────────
    const [redistributeTickets] = await db.execute(`
      SELECT * FROM tickets
      WHERE status IN ('open', 'in_progress')
      AND breach_risk >= 80
      AND agent_id IS NOT NULL
    `);

    if (redistributeTickets.length > 0) {
      console.log(`Auto-redistribution check: ${redistributeTickets.length} critical risk ticket(s)...`);

      for (const ticket of redistributeTickets) {

        // Find least loaded agent — excluding current agent
        const [agents] = await db.execute(`
          SELECT u.id, u.name, COUNT(t.id) AS open_count
          FROM users u
          LEFT JOIN tickets t 
            ON t.agent_id = u.id 
            AND t.status IN ('open', 'in_progress')
          WHERE u.role = 'agent'
          AND u.id != ?
          GROUP BY u.id, u.name
          ORDER BY open_count ASC
          LIMIT 1
        `, [ticket.agent_id]);

        if (agents.length === 0) {
          console.log(`No alternate agent available for Ticket #${ticket.id}`);
          continue;
        }

        const newAgent = agents[0];

        // Skip if new agent is already more loaded than current agent
        const [currentLoad] = await db.execute(`
          SELECT COUNT(*) AS open_count FROM tickets
          WHERE agent_id = ? AND status IN ('open', 'in_progress')
        `, [ticket.agent_id]);

        if (newAgent.open_count >= currentLoad[0].open_count) {
          console.log(`Ticket #${ticket.id} — no better agent available, skipping redistribution`);
          continue;
        }

        const oldAgentId = ticket.agent_id;

        // Reassign the ticket
        await db.execute(
          `UPDATE tickets SET agent_id = ? WHERE id = ?`,
          [newAgent.id, ticket.id]
        );

        // Log the reassignment
        const [admins] = await db.execute(
          'SELECT id FROM users WHERE role = ?', ['admin']
        );

        await db.execute(`
          INSERT INTO ticket_logs
          (ticket_id, changed_by, old_status, new_status, note)
          VALUES (?, ?, ?, ?, ?)`,
          [
            ticket.id,
            admins[0].id,
            ticket.status,
            ticket.status,
            `Auto-redistributed — breach risk ${ticket.breach_risk}%. Reassigned from agent #${oldAgentId} to agent #${newAgent.id} (${newAgent.name})`
          ]
        );

        // Notify old agent
        await db.execute(
          'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
          [oldAgentId, `Ticket #${ticket.id}: "${ticket.title}" has been auto-reassigned due to ${ticket.breach_risk}% breach risk`]
        );

        // Notify new agent
        await db.execute(
          'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
          [newAgent.id, `⚠️ Ticket #${ticket.id}: "${ticket.title}" has been assigned to you — breach risk is ${ticket.breach_risk}%. Please prioritize immediately.`]
        );

        // Notify admins
        for (const admin of admins) {
          await db.execute(
            'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
            [admin.id, `Auto-redistributed Ticket #${ticket.id} from agent #${oldAgentId} to ${newAgent.name} — breach risk ${ticket.breach_risk}%`]
          );
        }

        console.log(`✅ Ticket #${ticket.id} auto-redistributed to ${newAgent.name} (breach risk: ${ticket.breach_risk}%)`);
      }
    }

  } catch (error) {
    console.error('SLA job error:', error.message);
  }
};

const startSLAEscalationJob = () => {
  setInterval(runSLACheck, 15 * 60 * 1000);
  runSLACheck();
  console.log('SLA escalation job started — runs every 15 minutes');
};

module.exports = startSLAEscalationJob;