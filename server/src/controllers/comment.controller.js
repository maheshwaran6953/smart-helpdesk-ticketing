const db = require('../config/db');

exports.addComment = async (req, res) => {
try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
    return res.status(400).json({ message: 'Comment message is required' });
    }

    const [ticket] = await db.execute('SELECT * FROM tickets WHERE id = ?', [id]);
    if (!ticket.length) {
    return res.status(404).json({ message: 'Ticket not found' });
    }

    const [result] = await db.execute(
    'INSERT INTO comments (ticket_id, user_id, message) VALUES (?, ?, ?)',
    [id, req.user.id, message]
    );

    const ticketData = ticket[0];
    let notifyUserId;

    if (req.user.id === ticketData.user_id) {
    notifyUserId = ticketData.agent_id;
    } else {
    notifyUserId = ticketData.user_id;
    }

    if (notifyUserId) {
    await db.execute(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [notifyUserId, `New comment on ticket: "${ticketData.title}"`]
    );
    }

    res.status(201).json({
    message: 'Comment added successfully',
    comment: {
        id: result.insertId,
        ticket_id: parseInt(id),
        user_id: req.user.id,
        message
    }
    });

} catch (error) {
    console.error('Add comment error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};

exports.getComments = async (req, res) => {
try {
    const { id } = req.params;

    const [ticket] = await db.execute('SELECT * FROM tickets WHERE id = ?', [id]);
    if (!ticket.length) {
    return res.status(404).json({ message: 'Ticket not found' });
    }

    const [comments] = await db.execute(`
    SELECT 
        c.id,
        c.message,
        c.created_at,
        u.name AS commenter_name,
        u.role AS commenter_role
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.ticket_id = ?
    ORDER BY c.created_at ASC
    `, [id]);

    res.status(200).json({ comments });

} catch (error) {
    console.error('Get comments error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};