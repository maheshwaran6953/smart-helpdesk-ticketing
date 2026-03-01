const db = require('../config/db');
const { calculateBreachRisk, calculateBurnoutScore, calculateVolumeForecast } = require('../utils/predictiveEngine');

// ─────────────────────────────────────────────
// GET /api/predictive/breach-risk
// Returns breach risk for ALL open tickets
// ─────────────────────────────────────────────
const getAllBreachRisks = async (req, res) => {
  try {
    const [tickets] = await db.execute(
      `SELECT t.*, c.name AS category_name 
       FROM tickets t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.status NOT IN ('closed', 'resolved', 'pending_verification')`
    );

    if (tickets.length === 0) {
      return res.json({ success: true, message: 'No open tickets found', data: [] });
    }

    const results = await Promise.all(
      tickets.map(async (ticket) => {
        const { score, reason } = await calculateBreachRisk(ticket);
        const level = score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';

        return {
          ticket_id: ticket.id,
          title: ticket.title,
          priority: ticket.priority,
          status: ticket.status,
          assigned_to: ticket.assigned_to,
          sla_deadline: ticket.sla_deadline,
          breach_risk_score: score,
          breach_risk_level: level,
          breach_risk_reason: reason
        };
      })
    );

    // Sort by risk score descending (most at-risk first)
    results.sort((a, b) => b.breach_risk_score - a.breach_risk_score);

    res.json({ success: true, count: results.length, data: results });

  } catch (error) {
    console.error('getAllBreachRisks error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/predictive/breach-risk/:ticketId
// Returns breach risk for ONE specific ticket
// ─────────────────────────────────────────────
const getTicketBreachRisk = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const [rows] = await db.execute(
      `SELECT t.*, c.name AS category_name 
       FROM tickets t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = ?`,
      [ticketId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const ticket = rows[0];
    const { score, reason } = await calculateBreachRisk(ticket);
    const level = score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';

    // Persist the latest risk score back to DB
    await db.execute(
      `UPDATE tickets SET breach_risk = ?, breach_risk_reason = ? WHERE id = ?`,
      [score, reason, ticketId]
    );

    res.json({
      success: true,
      data: {
        ticket_id: ticket.id,
        title: ticket.title,
        priority: ticket.priority,
        status: ticket.status,
        sla_deadline: ticket.sla_deadline,
        breach_risk_score: score,
        breach_risk_level: level,
        breach_risk_reason: reason
      }
    });

  } catch (error) {
    console.error('getTicketBreachRisk error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/predictive/burnout/:agentId
// Returns burnout score for a specific agent
// ─────────────────────────────────────────────
const getAgentBurnout = async (req, res) => {
  try {
    const { agentId } = req.params;

    // Verify agent exists
    const [agentRows] = await db.execute(
      `SELECT id, name, email, role FROM users WHERE id = ? AND role = 'agent'`,
      [agentId]
    );

    if (agentRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    const result = await calculateBurnoutScore(agentId);

    if (!result) {
      return res.status(500).json({ success: false, message: 'Burnout calculation failed' });
    }

    const score = result.burnout_score;
    const level = result.burnout_level;
    const breakdown = {
      open_tickets: result.open_tickets,
      critical_tickets: result.critical_tickets,
      resolved_today: result.resolved_today,
      hours_since_last_resolution: result.hours_since_last_resolution,
      is_paused: result.is_paused
    };

    // Upsert into agent_health table
    await db.execute(
      `INSERT INTO agent_health (agent_id, burnout_score, burnout_level, last_calculated)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
         burnout_score = VALUES(burnout_score),
         burnout_level = VALUES(burnout_level),
         last_calculated = NOW()`,
      [agentId, score, level]
    );

    res.json({
      success: true,
      data: {
        agent_id: agentId,
        agent_name: agentRows[0].name,
        agent_email: agentRows[0].email,
        burnout_score: score,
        burnout_level: level,
        breakdown
      }
    });

  } catch (error) {
    console.error('getAgentBurnout error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/predictive/burnout
// Returns burnout score for ALL agents
// ─────────────────────────────────────────────
const getAllAgentBurnout = async (req, res) => {
  try {
    const [agents] = await db.execute(
      `SELECT id, name, email FROM users WHERE role = 'agent'`
    );

    if (agents.length === 0) {
      return res.json({ success: true, message: 'No agents found', data: [] });
    }

    const results = await Promise.all(
      agents.map(async (agent) => {
        const result = await calculateBurnoutScore(agent.id);

        if (!result) return null;

        const score = result.burnout_score;
        const level = result.burnout_level;
        const breakdown = {
          open_tickets: result.open_tickets,
          critical_tickets: result.critical_tickets,
          resolved_today: result.resolved_today,
          hours_since_last_resolution: result.hours_since_last_resolution,
          is_paused: result.is_paused
        };

        // Upsert health record
        await db.execute(
          `INSERT INTO agent_health (agent_id, burnout_score, burnout_level, last_calculated)
           VALUES (?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE 
             burnout_score = VALUES(burnout_score),
             burnout_level = VALUES(burnout_level),
             last_calculated = NOW()`,
          [agent.id, score, level]
        );

        return {
          agent_id: agent.id,
          agent_name: agent.name,
          agent_email: agent.email,
          burnout_score: score,
          burnout_level: level,
          breakdown
        };
      })
    );

    // Filter out any nulls + sort by burnout score descending
    const filtered = results
      .filter(r => r !== null)
      .sort((a, b) => b.burnout_score - a.burnout_score);

    res.json({ success: true, count: filtered.length, data: filtered });

  } catch (error) {
    console.error('getAllAgentBurnout error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/predictive/forecast
// Returns 7-day volume forecast
// ─────────────────────────────────────────────
const getVolumeForecast = async (req, res) => {
  try {
    const forecast = await calculateVolumeForecast();

    if (!forecast) {
      return res.status(500).json({ success: false, message: 'Forecast calculation failed' });
    }

    if (forecast.forecast === null) {
      return res.json({ success: false, message: forecast.message });
    }

    res.json({
      success: true,
      data: {
        forecast_generated_at: new Date().toISOString(),
        ...forecast
      }
    });

  } catch (error) {
    console.error('getVolumeForecast error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllBreachRisks,
  getTicketBreachRisk,
  getAgentBurnout,
  getAllAgentBurnout,
  getVolumeForecast
};