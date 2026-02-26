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

exports.updateTicketStatus = async (req, res) => {
try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
    }

    const [rows] = await db.execute('SELECT * FROM tickets WHERE id = ?', [id]);
    if (!rows.length) {
    return res.status(404).json({ message: 'Ticket not found' });
    }

    const oldStatus = rows[0].status;

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
    [rows[0].user_id, `Your ticket "${rows[0].title}" status changed to: ${status}`]
    );

    res.status(200).json({ message: `Ticket status updated to: ${status}` });

} catch (error) {
    console.error('Update status error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};