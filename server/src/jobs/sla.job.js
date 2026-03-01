const db = require('../config/db');
const { calculateBreachRisk } = require('../utils/predictiveEngine');

const runSLACheck = async () => {
  console.log('Running SLA escalation check...');

  try {

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