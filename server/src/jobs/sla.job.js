const cron = require('node-cron');
const db = require('../config/db');

const startSLAEscalationJob = () => {

cron.schedule('*/15* * * *', async () => {
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
        return;
    }

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
        [
            ticket.id,
            admins[0].id,
            ticket.status,
            ticket.status,
            'Auto escalated — SLA breached'
        ]
        );

        for (const admin of admins) {
        await db.execute(
            'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
            [
            admin.id,
            `SLA BREACHED — Ticket #${ticket.id}: "${ticket.title}" has exceeded its deadline`
            ]
        );
        }

        if (ticket.agent_id) {
        await db.execute(
            'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
            [
            ticket.agent_id,
            `URGENT — Ticket #${ticket.id}: "${ticket.title}" has breached SLA. Please resolve immediately.`
            ]
        );
        }

        console.log(`Ticket #${ticket.id} escalated successfully`);
    }

    } catch (error) {
    console.error('SLA job error:', error.message);
    }
});

console.log('SLA escalation job started — runs every 15 minutes');
};

module.exports = startSLAEscalationJob;