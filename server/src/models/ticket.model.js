const db = require('../config/db');

const Ticket = {};

// Create new ticket
Ticket.create = (newTicket, result) => {
const query = `
    INSERT INTO tickets 
    (title, description, category_id, priority, user_id, sla_deadline)
    VALUES (?, ?, ?, ?, ?, ?)
`;
db.query(
    query,
    [
    newTicket.title,
    newTicket.description,
    newTicket.category_id,
    newTicket.priority || 'medium',
    newTicket.user_id,
    newTicket.sla_deadline || null
    ],
    (err, res) => {
    if (err) {
        console.error('Error creating ticket:', err);
        return result(err, null);
    }
    console.log('Ticket created with id:', res.insertId);
    result(null, { id: res.insertId, ...newTicket });
    }
);
};

// Get all tickets (with joined names)
Ticket.getAll = (result) => {
const query = `
    SELECT 
    t.*,
    u.name AS user_name,
    a.name AS agent_name,
    c.name AS category_name
    FROM tickets t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN users a ON t.agent_id = a.id
    LEFT JOIN categories c ON t.category_id = c.id
    ORDER BY t.created_at DESC
`;
db.query(query, (err, res) => {
    if (err) {
    console.error('Error fetching tickets:', err);
    return result(err, null);
    }
    result(null, res);
});
};

// Find ticket by ID
Ticket.findById = (id, result) => {
const query = `
    SELECT 
    t.*,
    u.name AS user_name,
    a.name AS agent_name,
    c.name AS category_name
    FROM tickets t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN users a ON t.agent_id = a.id
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = ?
`;
db.query(query, [id], (err, res) => {
    if (err) {
    console.error('Error finding ticket:', err);
    return result(err, null);
    }
    if (res.length) {
    return result(null, res[0]);
    }
    result({ kind: "not_found" }, null);
});
};

module.exports = Ticket;