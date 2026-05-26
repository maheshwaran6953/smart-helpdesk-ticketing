const cron = require('node-cron');
const { Ticket, User } = require('../models');

const startSLAEscalationJob = () => {
  console.log('SLA escalation job scheduled for every 15 minutes');

  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      console.log('Running SLA escalation check...');

      // Find all open tickets with SLA deadline passed
      const now = new Date();
      const breachedTickets = await Ticket.find({
        status: { $ne: 'closed' },
        slaDeadline: { $lt: now },
        isEscalated: false
      });

      if (breachedTickets.length === 0) {
        console.log('✅ No SLA breaches found');
        return;
      }

      console.log(`⚠️ Found ${breachedTickets.length} breached ticket(s)`);

      // Mark tickets as escalated
      for (const ticket of breachedTickets) {
        ticket.isEscalated = true;
        await ticket.save();
        console.log(`📌 Ticket #${ticket.ticketId} marked as escalated`);
      }

      // Auto-redistribute high-risk tickets
      console.log('🔄 Auto-redistribution check...');
      const allOpenTickets = await Ticket.find({ 
        status: { $in: ['open', 'in_progress'] } 
      }).populate('assignedAgentId');

      for (const ticket of allOpenTickets) {
        if (ticket.breachRiskScore >= 80 && ticket.assignedAgentId) {
          // Find least loaded agent
          const agents = await User.find({ role: 'agent' });
          if (agents.length === 0) continue;

          const agentLoads = await Promise.all(
            agents.map(async (agent) => {
              const count = await Ticket.countDocuments({
                assignedAgentId: agent._id,
                status: { $in: ['open', 'in_progress'] }
              });
              return { agent, count };
            })
          );

          const leastLoaded = agentLoads.reduce((prev, current) =>
            prev.count < current.count ? prev : current
          );

          if (leastLoaded.agent._id.toString() !== ticket.assignedAgentId._id.toString()) {
            ticket.assignedAgentId = leastLoaded.agent._id;
            await ticket.save();
            console.log(`✅ Ticket #${ticket.ticketId} auto-redistributed to ${leastLoaded.agent.name}`);
          }
        }
      }

      // Auto-close pending_verification tickets after 48 hours
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const pendingOldTickets = await Ticket.find({
        status: 'pending_verification',
        updatedAt: { $lt: twoDaysAgo }
      });

      for (const ticket of pendingOldTickets) {
        ticket.status = 'closed';
        ticket.closedAt = now;
        await ticket.save();
        console.log(`🔒 Ticket #${ticket.ticketId} auto-closed after 48h inactivity`);
      }

      console.log('✅ SLA job completed');
    } catch (error) {
      console.error('❌ SLA job error:', error.message);
    }
  });
};

module.exports = startSLAEscalationJob;