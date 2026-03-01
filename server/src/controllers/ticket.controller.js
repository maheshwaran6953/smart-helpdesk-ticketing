const Ticket = require('../models/ticket.model');
const db = require('../config/db');

const getSLADeadline = (priority) => {
const hours = {
    critical: 2,
    high: 4,
    medium: 8,
    low: 24
};
const now = new Date();
now.setHours(now.getHours() + hours[priority]);
return now;
};

const autoAssignAgent = async (category_id) => {
const [agents] = await db.execute(`
    SELECT u.id, COUNT(t.id) AS open_tickets
    FROM users u
    LEFT JOIN tickets t 
    ON t.agent_id = u.id 
    AND t.status IN ('open', 'in_progress')
    WHERE u.role = 'agent'
    GROUP BY u.id
    ORDER BY open_tickets ASC
    LIMIT 1
`);
return agents.length ? agents[0].id : null;
};

exports.createTicket = async (req, res) => {
try {
    const { title, description, category_id, priority } = req.body;

    if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required' });
    }

    const sla_deadline = getSLADeadline(priority || 'medium');
    const agent_id = await autoAssignAgent(category_id);

    const newTicket = {
    title,
    description,
    category_id: category_id || null,
    priority: priority || 'medium',
    user_id: req.user.id,
    agent_id,
    sla_deadline
    };

    const ticket = await Ticket.create(newTicket);

    await db.execute(
    'INSERT INTO ticket_logs (ticket_id, changed_by, old_status, new_status, note) VALUES (?, ?, ?, ?, ?)',
    [ticket.id, req.user.id, null, 'open', 'Ticket created']
    );

    if (agent_id) {
    await db.execute(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [agent_id, `New ticket assigned to you: ${title}`]
    );
    }

    res.status(201).json({
    message: 'Ticket created successfully',
    ticket
    });

} catch (error) {
    console.error('Create ticket error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};

exports.getAllTickets = async (req, res) => {
try {
    let query;
    let params = [];

    if (req.user.role === 'admin') {
    query = `
        SELECT t.*, 
        u.name AS user_name, 
        a.name AS agent_name, 
        c.name AS category_name
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN users a ON t.agent_id = a.id
        LEFT JOIN categories c ON t.category_id = c.id
        ORDER BY t.created_at DESC
    `;
    } else if (req.user.role === 'agent') {
    query = `
        SELECT t.*, 
        u.name AS user_name, 
        a.name AS agent_name, 
        c.name AS category_name
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN users a ON t.agent_id = a.id
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.agent_id = ?
        ORDER BY t.created_at DESC
    `;
    params = [req.user.id];
    } else {
    query = `
        SELECT t.*, 
        u.name AS user_name, 
        a.name AS agent_name, 
        c.name AS category_name
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN users a ON t.agent_id = a.id
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ?
        ORDER BY t.created_at DESC
    `;
    params = [req.user.id];
    }

    const [tickets] = await db.execute(query, params);
    res.status(200).json({ tickets });

} catch (error) {
    console.error('Get tickets error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};

exports.getTicketById = async (req, res) => {
try {
    const { id } = req.params;

    const [rows] = await db.execute(`
    SELECT t.*, 
        u.name AS user_name, 
        a.name AS agent_name, 
        c.name AS category_name
    FROM tickets t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN users a ON t.agent_id = a.id
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = ?
    `, [id]);

    if (!rows.length) {
    return res.status(404).json({ message: 'Ticket not found' });
    }

    res.status(200).json({ ticket: rows[0] });

} catch (error) {
    console.error('Get ticket error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};

// ─────────────────────────────────────────────
// PATCH /api/tickets/:id/status
// Updated with Two-Way Closure Handshake
// ─────────────────────────────────────────────
exports.updateTicketStatus = async (req, res) => {
try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed', 'pending_verification'];
    if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
    }

    const [rows] = await db.execute('SELECT * FROM tickets WHERE id = ?', [id]);
    if (!rows.length) {
    return res.status(404).json({ message: 'Ticket not found' });
    }

    const ticket = rows[0];
    const oldStatus = ticket.status;

    // ─────────────────────────────────────────────
    // HANDSHAKE RULE 1
    // Agent marks as 'resolved' → force to 'pending_verification'
    // ─────────────────────────────────────────────
    if (status === 'resolved' && req.user.role === 'agent') {
    await db.execute(
        'UPDATE tickets SET status = ?, resolved_at = NOW() WHERE id = ?',
        ['pending_verification', id]
    );

    await db.execute(
        'INSERT INTO ticket_logs (ticket_id, changed_by, old_status, new_status, note) VALUES (?, ?, ?, ?, ?)',
        [id, req.user.id, oldStatus, 'pending_verification', note || 'Agent marked as resolved — awaiting user confirmation']
    );

    // Notify the user to confirm closure
    await db.execute(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [ticket.user_id, `Your ticket "${ticket.title}" has been resolved by the agent. Please confirm if your issue is fixed or reopen it.`]
    );

    return res.status(200).json({
        message: 'Ticket marked as pending verification. User must confirm closure.',
        status: 'pending_verification'
    });
    }

    // ─────────────────────────────────────────────
    // HANDSHAKE RULE 2
    // Admin can directly resolve or close any ticket
    // ─────────────────────────────────────────────
    if (req.user.role === 'admin') {
    await db.execute(
        'UPDATE tickets SET status = ? WHERE id = ?',
        [status, id]
    );

    await db.execute(
        'INSERT INTO ticket_logs (ticket_id, changed_by, old_status, new_status, note) VALUES (?, ?, ?, ?, ?)',
        [id, req.user.id, oldStatus, status, note || `Admin updated status to ${status}`]
    );

    await db.execute(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [ticket.user_id, `Your ticket "${ticket.title}" status changed to: ${status}`]
    );

    return res.status(200).json({ message: `Ticket status updated to: ${status}` });
    }

    // ─────────────────────────────────────────────
    // HANDSHAKE RULE 3
    // Regular status updates (open → in_progress etc.)
    // ─────────────────────────────────────────────
    await db.execute(
    'UPDATE tickets SET status = ? WHERE id = ?',
    [status, id]
    );

    await db.execute(
    'INSERT INTO ticket_logs (ticket_id, changed_by, old_status, new_status, note) VALUES (?, ?, ?, ?, ?)',
    [id, req.user.id, oldStatus, status, note || null]
    );

    await db.execute(
    'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
    [ticket.user_id, `Your ticket "${ticket.title}" status changed to: ${status}`]
    );

    res.status(200).json({ message: `Ticket status updated to: ${status}` });

} catch (error) {
    console.error('Update status error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};

// ─────────────────────────────────────────────
// POST /api/tickets/:id/verify
// User confirms or rejects ticket closure
// ─────────────────────────────────────────────
exports.verifyTicketClosure = async (req, res) => {
try {
    const { id } = req.params;
    const { action } = req.body; // action = 'confirm' or 'reject'

    if (!['confirm', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Action must be confirm or reject' });
    }

    const [rows] = await db.execute('SELECT * FROM tickets WHERE id = ?', [id]);
    if (!rows.length) {
    return res.status(404).json({ message: 'Ticket not found' });
    }

    const ticket = rows[0];

    // Only the ticket owner can verify
    if (ticket.user_id !== req.user.id) {
    return res.status(403).json({ message: 'Only the ticket owner can confirm closure' });
    }

    // Ticket must be in pending_verification state
    if (ticket.status !== 'pending_verification') {
    return res.status(400).json({
        message: `Ticket is not awaiting verification. Current status: ${ticket.status}`
    });
    }

    if (action === 'confirm') {
    // ── User confirms → close the ticket
    await db.execute(
        'UPDATE tickets SET status = ?, closed_at = NOW() WHERE id = ?',
        ['closed', id]
    );

    await db.execute(
        'INSERT INTO ticket_logs (ticket_id, changed_by, old_status, new_status, note) VALUES (?, ?, ?, ?, ?)',
        [id, req.user.id, 'pending_verification', 'closed', 'User confirmed resolution — ticket closed']
    );

    // Notify agent
    if (ticket.agent_id) {
        await db.execute(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [ticket.agent_id, `✅ Ticket #${id}: "${ticket.title}" has been confirmed and closed by the user.`]
        );
    }

    return res.status(200).json({
        message: 'Ticket confirmed and closed successfully.',
        status: 'closed'
    });

    } else {
    // ── User rejects → reopen the ticket
    await db.execute(
        'UPDATE tickets SET status = ? WHERE id = ?',
        ['open', id]
    );

    await db.execute(
        'INSERT INTO ticket_logs (ticket_id, changed_by, old_status, new_status, note) VALUES (?, ?, ?, ?, ?)',
        [id, req.user.id, 'pending_verification', 'open', 'User rejected resolution — ticket reopened']
    );

    // Notify agent
    if (ticket.agent_id) {
        await db.execute(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [ticket.agent_id, `❌ Ticket #${id}: "${ticket.title}" was rejected by the user and has been reopened.`]
        );
    }

    // Notify admins
    const [admins] = await db.execute(
        'SELECT id FROM users WHERE role = ?', ['admin']
    );
    for (const admin of admins) {
        await db.execute(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [admin.id, `Ticket #${id}: "${ticket.title}" was reopened — user rejected the resolution.`]
        );
    }

    return res.status(200).json({
        message: 'Ticket rejected and reopened successfully.',
        status: 'open'
    });
    }

} catch (error) {
    console.error('Verify closure error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};