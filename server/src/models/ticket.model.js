const db = require('../config/db');

const Ticket = {};

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
        newTicket.priority,
        newTicket.user_id,
        newTicket.sla_deadline
        ],
        (err, res) => {
        if (err) {
            console.error('Error creating ticket:', err);
            result(err, null);
            return;
        }
        result(null, { id: res.insertId, ...newTicket });
        }
    );
    };

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
        if (err) return result(err, null);
        result(null, res);
    });
};

module.exports = Ticket;