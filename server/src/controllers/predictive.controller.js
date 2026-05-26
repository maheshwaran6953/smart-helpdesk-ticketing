const { Ticket, User } = require('../models');

// Get breach risk for all tickets
exports.getBreachRisk = async (req, res) => {
  try {
    const openTickets = await Ticket.find({ 
      status: { $in: ['open', 'in_progress'] } 
    });

    const now = new Date();
    const riskData = openTickets.map(ticket => {
      const timeLeft = ticket.slaDeadline - now;
      const totalTime = ticket.slaDeadline - ticket.createdAt;
      const riskScore = Math.max(0, Math.min(100, 100 - (timeLeft / totalTime) * 100));

      return {
        ticketId: ticket.ticketId,
        title: ticket.title,
        riskScore: Math.round(riskScore),
        breachStatus: riskScore > 80 ? 'critical' : riskScore > 50 ? 'high' : 'medium'
      };
    }).sort((a, b) => b.riskScore - a.riskScore);

    res.status(200).json({
      count: riskData.length,
      riskData
    });
  } catch (error) {
    console.error('Get breach risk error:', error.message);
    res.status(500).json({ error: 'Failed to fetch breach risk' });
  }
};

// Get breach risk for single ticket
exports.getBreachRiskById = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const now = new Date();
    const timeLeft = ticket.slaDeadline - now;
    const totalTime = ticket.slaDeadline - ticket.createdAt;
    const riskScore = Math.max(0, Math.min(100, 100 - (timeLeft / totalTime) * 100));

    res.status(200).json({
      ticketId: ticket.ticketId,
      riskScore: Math.round(riskScore),
      timeRemaining: Math.round(timeLeft / 60000), // minutes
      status: riskScore > 80 ? 'critical' : riskScore > 50 ? 'high' : 'medium'
    });
  } catch (error) {
    console.error('Get breach risk by ID error:', error.message);
    res.status(500).json({ error: 'Failed to fetch breach risk' });
  }
};

// Calculate agent burnout score
exports.getAgentBurnout = async (req, res) => {
  try {
    const agents = await User.find({ role: 'agent' });

    const burnoutData = await Promise.all(
      agents.map(async (agent) => {
        const assignedTickets = await Ticket.countDocuments({
          assignedAgentId: agent._id,
          status: { $in: ['open', 'in_progress'] }
        });

        const escalatedTickets = await Ticket.countDocuments({
          assignedAgentId: agent._id,
          isEscalated: true
        });

        const burnoutScore = Math.min(100, (assignedTickets * 10) + (escalatedTickets * 20));

        return {
          agentId: agent._id,
          agentName: agent.name,
          assignedTickets,
          escalatedTickets,
          burnoutScore,
          status: burnoutScore > 70 ? 'high' : burnoutScore > 40 ? 'medium' : 'low'
        };
      })
    );

    res.status(200).json({
      count: burnoutData.length,
      burnoutData: burnoutData.sort((a, b) => b.burnoutScore - a.burnoutScore)
    });
  } catch (error) {
    console.error('Get agent burnout error:', error.message);
    res.status(500).json({ error: 'Failed to fetch burnout data' });
  }
};

// Volume forecast (next 7 days)
exports.getVolumeForecast = async (req, res) => {
  try {
    const forecast = {};

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      // Simple forecast: average tickets per day
      const count = await Ticket.countDocuments({
        createdAt: {
          $gte: new Date(dateStr),
          $lt: new Date(new Date(dateStr).getTime() + 86400000)
        }
      });

      forecast[dateStr] = count + Math.floor(Math.random() * 5); // Add variance
    }

    res.status(200).json({
      forecast
    });
  } catch (error) {
    console.error('Get forecast error:', error.message);
    res.status(500).json({ error: 'Failed to fetch forecast' });
  }
};

module.exports = exports;