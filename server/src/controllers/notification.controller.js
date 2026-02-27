const db = require('../config/db');

// GET ALL NOTIFICATIONS FOR LOGGED IN USER
exports.getNotifications = async (req, res) => {
try {
    const [notifications] = await db.execute(`
    SELECT * FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    `, [req.user.id]);

    // Count unread
    const unreadCount = notifications.filter(n => !n.is_read).length;

    res.status(200).json({
    notifications,
    unread_count: unreadCount
    });

} catch (error) {
    console.error('Get notifications error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};

// MARK ALL NOTIFICATIONS AS READ
exports.markAllRead = async (req, res) => {
try {
    await db.execute(
    'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
    [req.user.id]
    );

    res.status(200).json({ message: 'All notifications marked as read' });

} catch (error) {
    console.error('Mark read error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};

// MARK SINGLE NOTIFICATION AS READ
exports.markOneRead = async (req, res) => {
try {
    const { id } = req.params;

    await db.execute(
    'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
    [id, req.user.id]
    );

    res.status(200).json({ message: 'Notification marked as read' });

} catch (error) {
    console.error('Mark one read error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};