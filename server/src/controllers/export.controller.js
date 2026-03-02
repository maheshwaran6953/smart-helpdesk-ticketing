const db = require('../config/db');
const ExcelJS = require('exceljs');

// ─────────────────────────────────────────────
// GET /api/admin/export/tickets
// Export all tickets as CSV
// ─────────────────────────────────────────────
exports.exportTicketsCSV = async (req, res) => {
try {
    const [tickets] = await db.execute(`
    SELECT 
        t.id, t.title, t.description, t.priority, t.status,
        t.breach_risk, t.breach_risk_reason,
        t.is_escalated, t.sla_deadline,
        t.created_at, t.resolved_at, t.closed_at,
        u.name AS user_name, u.email AS user_email,
        a.name AS agent_name, a.email AS agent_email,
        c.name AS category_name
    FROM tickets t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN users a ON t.agent_id = a.id
    LEFT JOIN categories c ON t.category_id = c.id
    ORDER BY t.created_at DESC
    `);

    if (tickets.length === 0) {
    return res.status(404).json({ message: 'No tickets found to export' });
    }

    // Build CSV header
    const headers = [
    'ID', 'Title', 'Description', 'Priority', 'Status',
    'Breach Risk %', 'Breach Risk Reason',
    'Escalated', 'SLA Deadline',
    'Created At', 'Resolved At', 'Closed At',
    'User Name', 'User Email',
    'Agent Name', 'Agent Email',
    'Category'
    ];

    // Build CSV rows
    const rows = tickets.map(t => [
    t.id,
    `"${(t.title || '').replace(/"/g, '""')}"`,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    t.priority,
    t.status,
    t.breach_risk || 0,
    `"${(t.breach_risk_reason || '').replace(/"/g, '""')}"`,
    t.is_escalated ? 'Yes' : 'No',
    t.sla_deadline ? new Date(t.sla_deadline).toISOString() : '',
    t.created_at ? new Date(t.created_at).toISOString() : '',
    t.resolved_at ? new Date(t.resolved_at).toISOString() : '',
    t.closed_at ? new Date(t.closed_at).toISOString() : '',
    `"${(t.user_name || '').replace(/"/g, '""')}"`,
    t.user_email || '',
    `"${(t.agent_name || '').replace(/"/g, '""')}"`,
    t.agent_email || '',
    `"${(t.category_name || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
    ].join('\n');

    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="tickets_${Date.now()}.csv"`);
    res.send(csvContent);

} catch (error) {
    console.error('Export tickets CSV error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};

// ─────────────────────────────────────────────
// GET /api/admin/export/tickets/excel
// Export all tickets as Excel
// ─────────────────────────────────────────────
exports.exportTicketsExcel = async (req, res) => {
try {
    const [tickets] = await db.execute(`
    SELECT 
        t.id, t.title, t.description, t.priority, t.status,
        t.breach_risk, t.breach_risk_reason,
        t.is_escalated, t.sla_deadline,
        t.created_at, t.resolved_at, t.closed_at,
        u.name AS user_name, u.email AS user_email,
        a.name AS agent_name, a.email AS agent_email,
        c.name AS category_name
    FROM tickets t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN users a ON t.agent_id = a.id
    LEFT JOIN categories c ON t.category_id = c.id
    ORDER BY t.created_at DESC
    `);

    if (tickets.length === 0) {
    return res.status(404).json({ message: 'No tickets found to export' });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Smart Helpdesk System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Tickets', {
    pageSetup: { fitToPage: true, orientation: 'landscape' }
    });

    // Define columns
    sheet.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Title', key: 'title', width: 30 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Status', key: 'status', width: 20 },
    { header: 'Breach Risk %', key: 'breach_risk', width: 15 },
    { header: 'Breach Risk Reason', key: 'breach_risk_reason', width: 35 },
    { header: 'Escalated', key: 'is_escalated', width: 12 },
    { header: 'SLA Deadline', key: 'sla_deadline', width: 22 },
    { header: 'Created At', key: 'created_at', width: 22 },
    { header: 'Resolved At', key: 'resolved_at', width: 22 },
    { header: 'Closed At', key: 'closed_at', width: 22 },
    { header: 'User Name', key: 'user_name', width: 20 },
    { header: 'User Email', key: 'user_email', width: 28 },
    { header: 'Agent Name', key: 'agent_name', width: 20 },
    { header: 'Agent Email', key: 'agent_email', width: 28 },
    { header: 'Category', key: 'category_name', width: 20 },
    { header: 'Description', key: 'description', width: 50 },
    ];

    // Style header row
    sheet.getRow(1).eachCell((cell) => {
    cell.fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: 'FF1F4E79' }
    };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
    };
    });
    sheet.getRow(1).height = 25;

    // Add data rows
    tickets.forEach((t, index) => {
    const row = sheet.addRow({
        id: t.id,
        title: t.title || '',
        priority: t.priority || '',
        status: t.status || '',
        breach_risk: t.breach_risk || 0,
        breach_risk_reason: t.breach_risk_reason || '',
        is_escalated: t.is_escalated ? 'Yes' : 'No',
        sla_deadline: t.sla_deadline ? new Date(t.sla_deadline).toLocaleString() : '',
        created_at: t.created_at ? new Date(t.created_at).toLocaleString() : '',
        resolved_at: t.resolved_at ? new Date(t.resolved_at).toLocaleString() : '',
        closed_at: t.closed_at ? new Date(t.closed_at).toLocaleString() : '',
        user_name: t.user_name || '',
        user_email: t.user_email || '',
        agent_name: t.agent_name || '',
        agent_email: t.agent_email || '',
        category_name: t.category_name || '',
        description: t.description || ''
    });

    // Alternate row colors
    const bgColor = index % 2 === 0 ? 'FFD6E4F0' : 'FFFFFFFF';
    row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.alignment = { vertical: 'middle', wrapText: true };
        cell.border = {
        top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
        };
    });

    // Color code priority column
    const priorityCell = row.getCell('priority');
    const priorityColors = {
        critical: 'FFFF0000',
        high: 'FFFF6600',
        medium: 'FFFFFF00',
        low: 'FF00B050'
    };
    if (priorityColors[t.priority]) {
        priorityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: priorityColors[t.priority] } };
        priorityCell.font = { bold: true };
    }

    // Color code status column
    const statusCell = row.getCell('status');
    const statusColors = {
        open: 'FF00B0F0',
        in_progress: 'FFFFC000',
        pending_verification: 'FFFF6600',
        resolved: 'FF00B050',
        closed: 'FF7F7F7F'
    };
    if (statusColors[t.status]) {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusColors[t.status] } };
        statusCell.font = { bold: true };
    }
    });

    // Freeze header row
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Add summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 }
    ];

    const statusCounts = {};
    const priorityCounts = {};
    tickets.forEach(t => {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;
    });

    summarySheet.addRow({ metric: 'Total Tickets', value: tickets.length });
    summarySheet.addRow({ metric: '── By Status ──', value: '' });
    Object.entries(statusCounts).forEach(([s, c]) => {
    summarySheet.addRow({ metric: `  ${s}`, value: c });
    });
    summarySheet.addRow({ metric: '── By Priority ──', value: '' });
    Object.entries(priorityCounts).forEach(([p, c]) => {
    summarySheet.addRow({ metric: `  ${p}`, value: c });
    });
    summarySheet.addRow({ metric: 'Export Generated At', value: new Date().toLocaleString() });

    // Style summary header
    summarySheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="tickets_${Date.now()}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();

} catch (error) {
    console.error('Export tickets Excel error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};

// ─────────────────────────────────────────────
// GET /api/admin/export/agents
// Export agent performance report as CSV
// ─────────────────────────────────────────────
exports.exportAgentsCSV = async (req, res) => {
try {
    const [agents] = await db.execute(`
    SELECT 
        u.id, u.name, u.email,
        COUNT(t.id) AS total_assigned,
        SUM(CASE WHEN t.status IN ('open', 'in_progress') THEN 1 ELSE 0 END) AS open_tickets,
        SUM(CASE WHEN t.status IN ('resolved', 'closed') THEN 1 ELSE 0 END) AS resolved_tickets,
        SUM(CASE WHEN t.status = 'closed' THEN 1 ELSE 0 END) AS closed_tickets,
        SUM(CASE WHEN t.is_escalated = 1 THEN 1 ELSE 0 END) AS escalated_tickets,
        AVG(CASE WHEN t.status IN ('resolved', 'closed') 
        THEN TIMESTAMPDIFF(MINUTE, t.created_at, t.updated_at) 
        ELSE NULL END) AS avg_resolution_minutes,
        ah.burnout_score, ah.burnout_level
    FROM users u
    LEFT JOIN tickets t ON t.agent_id = u.id
    LEFT JOIN agent_health ah ON ah.agent_id = u.id
    WHERE u.role = 'agent'
    GROUP BY u.id, u.name, u.email, ah.burnout_score, ah.burnout_level
    `);

    if (agents.length === 0) {
    return res.status(404).json({ message: 'No agents found to export' });
    }

    const headers = [
    'ID', 'Name', 'Email',
    'Total Assigned', 'Open Tickets', 'Resolved Tickets', 'Closed Tickets',
    'Escalated Tickets', 'Avg Resolution (mins)',
    'Burnout Score', 'Burnout Level'
    ];

    const rows = agents.map(a => [
    a.id,
    `"${(a.name || '').replace(/"/g, '""')}"`,
    a.email || '',
    a.total_assigned || 0,
    a.open_tickets || 0,
    a.resolved_tickets || 0,
    a.closed_tickets || 0,
    a.escalated_tickets || 0,
    a.avg_resolution_minutes ? Math.round(a.avg_resolution_minutes) : 'N/A',
    a.burnout_score || 0,
    a.burnout_level || 'N/A'
    ]);

    const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="agent_performance_${Date.now()}.csv"`);
    res.send(csvContent);

} catch (error) {
    console.error('Export agents CSV error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};