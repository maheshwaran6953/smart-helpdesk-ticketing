const db = require('../config/db');

const Ticket = {};

// Create new ticket
Ticket.create = async (newTicket) => {
const query = `
    INSERT INTO tickets 
    (title, description, category_id, priority, user_id, agent_id, sla_deadline)
    VALUES (?, ?, ?, ?, ?, ?, ?)
`;
const [result] = await db.execute(query, [
    newTicket.title,
    newTicket.description,
    newTicket.category_id || null,
    newTicket.priority || 'medium',
    newTicket.user_id,
    newTicket.agent_id || null,
    newTicket.sla_deadline || null
]);
return { id: result.insertId, ...newTicket };
};

// Get all tickets
Ticket.getAll = async () => {
const query = `
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
const [rows] = await db.execute(query);
return rows;
};

// Find ticket by ID
Ticket.findById = async (id) => {
const query = `
    SELECT t.*, 
    u.name AS user_name, 
    a.name AS agent_name, 
    c.name AS category_name
    FROM tickets t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN users a ON t.agent_id = a.id
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = ?
`;
const [rows] = await db.execute(query, [id]);
if (rows.length) return rows[0];
return null;
};

module.exports = Ticket;