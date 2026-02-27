const db = require('../config/db');

exports.getDashboardStats = async (req, res) => {
try {

    const [statusStats] = await db.execute(`
    SELECT status, COUNT(*) AS count
    FROM tickets
    GROUP BY status
    `);

    const [categoryStats] = await db.execute(`
    SELECT c.name AS category, COUNT(t.id) AS count
    FROM tickets t
    LEFT JOIN categories c ON t.category_id = c.id
    GROUP BY c.name
    ORDER BY count DESC
    `);

    const [dailyStats] = await db.execute(`
    SELECT 
        DATE(created_at) AS date,
        COUNT(*) AS count
    FROM tickets
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    GROUP BY DATE(created_at)
    ORDER BY date ASC
    `);

    const [agentStats] = await db.execute(`
    SELECT 
        u.name AS agent_name,
        COUNT(t.id) AS total_assigned,
        SUM(CASE WHEN t.status = 'resolved' THEN 1 ELSE 0 END) AS resolved,
        SUM(CASE WHEN t.status IN ('open','in_progress') THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN t.is_escalated = 1 THEN 1 ELSE 0 END) AS escalated
    FROM users u
    LEFT JOIN tickets t ON t.agent_id = u.id
    WHERE u.role = 'agent'
    GROUP BY u.id, u.name
    `);

    const [slaStats] = await db.execute(`
    SELECT
        COUNT(*) AS total_resolved,
        SUM(CASE WHEN updated_at <= sla_deadline THEN 1 ELSE 0 END) AS resolved_within_sla
    FROM tickets
    WHERE status = 'resolved'
    `);

    const [summary] = await db.execute(`
    SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) AS open,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) AS closed,
        SUM(CASE WHEN is_escalated = 1 THEN 1 ELSE 0 END) AS escalated
    FROM tickets
    `);

    res.status(200).json({
    summary: summary[0],
    status_stats: statusStats,
    category_stats: categoryStats,
    daily_stats: dailyStats,
    agent_stats: agentStats,
    sla_stats: slaStats[0]
    });

} catch (error) {
    console.error('Dashboard stats error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};

exports.getAllUsers = async (req, res) => {
try {
    const [users] = await db.execute(`
    SELECT id, name, email, role, expertise, created_at
    FROM users
    ORDER BY created_at DESC
    `);
    res.status(200).json({ users });
} catch (error) {
    console.error('Get users error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};

exports.getTicketLogs = async (req, res) => {
try {
    const { id } = req.params;
    const [logs] = await db.execute(`
    SELECT 
        tl.*,
        u.name AS changed_by_name
    FROM ticket_logs tl
    LEFT JOIN users u ON tl.changed_by = u.id
    WHERE tl.ticket_id = ?
    ORDER BY tl.changed_at ASC
    `, [id]);
    res.status(200).json({ logs });
} catch (error) {
    console.error('Get logs error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};