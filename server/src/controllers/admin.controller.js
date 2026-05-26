const { Ticket, User, AuditLog } = require('../models');

// Get admin dashboard stats
exports.getDashboard = async (req, res) => {
  try {
    const totalTickets = await Ticket.countDocuments();
    const openTickets = await Ticket.countDocuments({ status: 'open' });
    const inProgressTickets = await Ticket.countDocuments({ status: 'in_progress' });
    const resolvedTickets = await Ticket.countDocuments({ status: 'resolved' });
    const breachedTickets = await Ticket.countDocuments({ isEscalated: true });
    
    const totalUsers = await User.countDocuments();
    const agentCount = await User.countDocuments({ role: 'agent' });
    const userCount = await User.countDocuments({ role: 'user' });

    res.status(200).json({
      dashboard: {
        tickets: {
          total: totalTickets,
          open: openTickets,
          inProgress: inProgressTickets,
          resolved: resolvedTickets,
          breached: breachedTickets
        },
        users: {
          total: totalUsers,
          agents: agentCount,
          endUsers: userCount
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error.message);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });

    res.status(200).json({
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get users error:', error.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get audit logs
exports.getAuditLogs = async (req, res) => {
  try {
    const { ticketId } = req.query;
    
    let filter = {};
    if (ticketId) filter.ticketId = ticketId;

    const logs = await AuditLog.find(filter)
      .populate('ticketId', 'ticketId title')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: logs.length,
      logs
    });
  } catch (error) {
    console.error('Get audit logs error:', error.message);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};

module.exports = exports;