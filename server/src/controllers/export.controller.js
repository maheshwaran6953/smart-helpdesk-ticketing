const { Ticket } = require('../models');

// Export tickets as CSV
exports.exportCSV = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('userId', 'name email')
      .populate('assignedAgentId', 'name email')
      .populate('categoryId', 'name');

    // Build CSV header
    let csv = 'Ticket ID,Title,Priority,Status,User,Agent,Category,Created At,SLA Deadline\n';

    // Add rows
    tickets.forEach(ticket => {
      csv += `"${ticket.ticketId}",`;
      csv += `"${ticket.title}",`;
      csv += `"${ticket.priority}",`;
      csv += `"${ticket.status}",`;
      csv += `"${ticket.userId?.name || 'N/A'}",`;
      csv += `"${ticket.assignedAgentId?.name || 'Unassigned'}",`;
      csv += `"${ticket.categoryId?.name || 'N/A'}",`;
      csv += `"${ticket.createdAt.toISOString()}",`;
      csv += `"${ticket.slaDeadline?.toISOString() || 'N/A'}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=tickets.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export CSV error:', error.message);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
};

// Export tickets as JSON
exports.exportJSON = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('userId', 'name email')
      .populate('assignedAgentId', 'name email')
      .populate('categoryId', 'name');

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=tickets.json');
    res.json({
      exportDate: new Date(),
      count: tickets.length,
      tickets
    });
  } catch (error) {
    console.error('Export JSON error:', error.message);
    res.status(500).json({ error: 'Failed to export JSON' });
  }
};

// Export agent reports
exports.exportAgentReport = async (req, res) => {
  try {
    const { agentId } = req.query;

    const query = agentId ? { assignedAgentId: agentId } : {};
    const tickets = await Ticket.find(query)
      .populate('userId', 'name email')
      .populate('assignedAgentId', 'name email');

    let csv = 'Ticket ID,Title,Status,Priority,Created,Resolved\n';

    tickets.forEach(ticket => {
      csv += `"${ticket.ticketId}",`;
      csv += `"${ticket.title}",`;
      csv += `"${ticket.status}",`;
      csv += `"${ticket.priority}",`;
      csv += `"${ticket.createdAt.toISOString()}",`;
      csv += `"${ticket.resolvedAt?.toISOString() || 'N/A'}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=agent-report.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export report error:', error.message);
    res.status(500).json({ error: 'Failed to export report' });
  }
};

module.exports = exports;