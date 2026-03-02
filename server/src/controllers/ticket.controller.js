const Ticket = require('../models/ticket.model');
const db = require('../config/db');

const getSLADeadline = (priority) => {
const hours = { critical: 2, high: 4, medium: 8, low: 24 };
const now = new Date();
now.setHours(now.getHours() + hours[priority]);
return now;
};

const autoAssignAgent = async (category_id) => {
const [agents] = await db.execute(`
    SELECT u.id, COUNT(t.id) AS open_tickets
    FROM users u
    LEFT JOIN tickets t ON t.agent_id = u.id AND t.status IN ('open', 'in_progress')
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
    title, description,
    category_id: category_id || null,
    priority: priority || 'medium',
    user_id: req.user.id,
    agent_id, sla_deadline
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
    res.status(201).json({ message: 'Ticket created successfully', ticket });
} catch (error) {
    console.error('Create ticket error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};

exports.getAllTickets = async (req, res) => {
try {
    const { status, priority, category_id, search } = req.query;
    let conditions = [];
    let params = [];
    if (req.user.role === 'agent') { conditions.push('t.agent_id = ?'); params.push(req.user.id); }
    else if (req.user.role === 'user') { conditions.push('t.user_id = ?'); params.push(req.user.id); }
    if (status) { conditions.push('t.status = ?'); params.push(status); }
    if (priority) { conditions.push('t.priority = ?'); params.push(priority); }
    if (category_id) { conditions.push('t.category_id = ?'); params.push(category_id); }
    if (search) {
    conditions.push('(t.title LIKE ? OR t.description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
    }
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const query = `
    SELECT t.*, u.name AS user_name, a.name AS agent_name, c.name AS category_name
    FROM tickets t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN users a ON t.agent_id = a.id
    LEFT JOIN categories c ON t.category_id = c.id
    ${whereClause}
    ORDER BY t.created_at DESC
    `;
    const [tickets] = await db.execute(query, params);
    res.status(200).json({ count: tickets.length, tickets });
} catch (error) {
    console.error('Get tickets error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};

exports.getTicketById = async (req, res) => {
try {
    const { id } = req.params;
    const [rows] = await db.execute(`
    SELECT t.*, u.name AS user_name, a.name AS agent_name, c.name AS category_name
    FROM tickets t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN users a ON t.agent_id = a.id
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = ?
    `, [id]);
    if (!rows.length) return res.status(404).json({ message: 'Ticket not found' });
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
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed', 'pending_verification'];
    if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
    }
    const [rows] = await db.execute('SELECT * FROM tickets WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Ticket not found' });
    const ticket = rows[0];
    const oldStatus = ticket.status;

    if (status === 'resolved' && req.user.role === 'agent') {
    await db.execute('UPDATE tickets SET status = ?, resolved_at = NOW() WHERE id = ?', ['pending_verification', id]);
    await db.execute(
        'INSERT INTO ticket_logs (ticket_id, changed_by, old_status, new_status, note) VALUES (?, ?, ?, ?, ?)',
        [id, req.user.id, oldStatus, 'pending_verification', note || 'Agent marked as resolved — awaiting user confirmation']
    );
    await db.execute('INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [ticket.user_id, `Your ticket "${ticket.title}" has been resolved by the agent. Please confirm if your issue is fixed or reopen it.`]
    );
    return res.status(200).json({ message: 'Ticket marked as pending verification. User must confirm closure.', status: 'pending_verification' });
    }

    if (req.user.role === 'admin') {
    await db.execute('UPDATE tickets SET status = ? WHERE id = ?', [status, id]);
    await db.execute(
        'INSERT INTO ticket_logs (ticket_id, changed_by, old_status, new_status, note) VALUES (?, ?, ?, ?, ?)',
        [id, req.user.id, oldStatus, status, note || `Admin updated status to ${status}`]
    );
    await db.execute('INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [ticket.user_id, `Your ticket "${ticket.title}" status changed to: ${status}`]
    );
    return res.status(200).json({ message: `Ticket status updated to: ${status}` });
    }

    await db.execute('UPDATE tickets SET status = ? WHERE id = ?', [status, id]);
    await db.execute(
    'INSERT INTO ticket_logs (ticket_id, changed_by, old_status, new_status, note) VALUES (?, ?, ?, ?, ?)',
    [id, req.user.id, oldStatus, status, note || null]
    );
    await db.execute('INSERT INTO notifications (user_id, message) VALUES (?, ?)',
    [ticket.user_id, `Your ticket "${ticket.title}" status changed to: ${status}`]
    );
    res.status(200).json({ message: `Ticket status updated to: ${status}` });
} catch (error) {
    console.error('Update status error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};

exports.verifyTicketClosure = async (req, res) => {
try {
    const { id } = req.params;
    const { action } = req.body;
    if (!['confirm', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Action must be confirm or reject' });
    }
    const [rows] = await db.execute('SELECT * FROM tickets WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Ticket not found' });
    const ticket = rows[0];
    if (ticket.user_id !== req.user.id) {
    return res.status(403).json({ message: 'Only the ticket owner can confirm closure' });
    }
    if (ticket.status !== 'pending_verification') {
    return res.status(400).json({ message: `Ticket is not awaiting verification. Current status: ${ticket.status}` });
    }
    if (action === 'confirm') {
    await db.execute('UPDATE tickets SET status = ?, closed_at = NOW() WHERE id = ?', ['closed', id]);
    await db.execute(
        'INSERT INTO ticket_logs (ticket_id, changed_by, old_status, new_status, note) VALUES (?, ?, ?, ?, ?)',
        [id, req.user.id, 'pending_verification', 'closed', 'User confirmed resolution — ticket closed']
    );
    if (ticket.agent_id) {
        await db.execute('INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [ticket.agent_id, `✅ Ticket #${id}: "${ticket.title}" has been confirmed and closed by the user.`]
        );
    }
    return res.status(200).json({ message: 'Ticket confirmed and closed successfully.', status: 'closed' });
    } else {
    await db.execute('UPDATE tickets SET status = ? WHERE id = ?', ['open', id]);
    await db.execute(
        'INSERT INTO ticket_logs (ticket_id, changed_by, old_status, new_status, note) VALUES (?, ?, ?, ?, ?)',
        [id, req.user.id, 'pending_verification', 'open', 'User rejected resolution — ticket reopened']
    );
    if (ticket.agent_id) {
        await db.execute('INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [ticket.agent_id, `❌ Ticket #${id}: "${ticket.title}" was rejected by the user and has been reopened.`]
        );
    }
    const [admins] = await db.execute('SELECT id FROM users WHERE role = ?', ['admin']);
    for (const admin of admins) {
        await db.execute('INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [admin.id, `Ticket #${id}: "${ticket.title}" was reopened — user rejected the resolution.`]
        );
    }
    return res.status(200).json({ message: 'Ticket rejected and reopened successfully.', status: 'open' });
    }
} catch (error) {
    console.error('Verify closure error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};

exports.reassignTicket = async (req, res) => {
try {
    const { id } = req.params;
    const { agent_id, note } = req.body;
    if (!agent_id) return res.status(400).json({ message: 'agent_id is required' });
    const [rows] = await db.execute('SELECT * FROM tickets WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Ticket not found' });
    const ticket = rows[0];
    const oldAgentId = ticket.agent_id;
    const [agentRows] = await db.execute('SELECT id, name FROM users WHERE id = ? AND role = ?', [agent_id, 'agent']);
    if (!agentRows.length) return res.status(404).json({ message: 'Agent not found' });
    const newAgent = agentRows[0];
    await db.execute('UPDATE tickets SET agent_id = ? WHERE id = ?', [agent_id, id]);
    await db.execute(
    'INSERT INTO ticket_logs (ticket_id, changed_by, old_status, new_status, note) VALUES (?, ?, ?, ?, ?)',
    [id, req.user.id, ticket.status, ticket.status, note || `Manually reassigned from agent #${oldAgentId} to ${newAgent.name} by admin`]
    );
    await db.execute('INSERT INTO notifications (user_id, message) VALUES (?, ?)',
    [agent_id, `Ticket #${id}: "${ticket.title}" has been assigned to you by admin.`]
    );
    if (oldAgentId && oldAgentId !== parseInt(agent_id)) {
    await db.execute('INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [oldAgentId, `Ticket #${id}: "${ticket.title}" has been reassigned to another agent by admin.`]
    );
    }
    await db.execute('INSERT INTO notifications (user_id, message) VALUES (?, ?)',
    [ticket.user_id, `Your ticket "${ticket.title}" has been reassigned to a new agent.`]
    );
    res.status(200).json({
    message: `Ticket #${id} successfully reassigned to ${newAgent.name}`,
    ticket_id: id, new_agent_id: agent_id, new_agent_name: newAgent.name
    });
} catch (error) {
    console.error('Reassign ticket error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};

exports.getKBSuggestions = async (req, res) => {
try {
    const { id } = req.params;
    const [rows] = await db.execute('SELECT * FROM tickets WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Ticket not found' });
    const ticket = rows[0];

    let [kbArticles] = await db.execute(`
    SELECT id, title, problem_description, solution, category_id, times_used
    FROM knowledge_base
    WHERE category_id = ?
    ORDER BY times_used DESC LIMIT 10
    `, [ticket.category_id]);

    if (kbArticles.length < 3) {
    const [general] = await db.execute(`
        SELECT id, title, problem_description, solution, category_id, times_used
        FROM knowledge_base
        WHERE category_id != ? OR category_id IS NULL
        ORDER BY times_used DESC LIMIT 10
    `, [ticket.category_id || 0]);
    kbArticles = [...kbArticles, ...general];
    }

    if (kbArticles.length === 0) {
    return res.json({ success: true, message: 'No KB articles found', suggestions: [] });
    }

    const ticketText = `${ticket.title} ${ticket.description}`.toLowerCase();
    const ticketWords = ticketText.split(/\W+/).filter(w => w.length > 3);

    const scored = kbArticles.map(article => {
    const articleText = `${article.title} ${article.problem_description}`.toLowerCase();
    const matchCount = ticketWords.filter(word => articleText.includes(word)).length;
    const score = ticketWords.length > 0 ? Math.round((matchCount / ticketWords.length) * 100) : 0;
    return { ...article, relevance_score: score };
    });

    const top3 = scored
    .sort((a, b) => b.relevance_score - a.relevance_score || b.times_used - a.times_used)
    .slice(0, 3);

    res.json({ success: true, ticket_id: ticket.id, ticket_title: ticket.title, suggestions: top3 });
} catch (error) {
    console.error('KB suggestions error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};

exports.applySolution = async (req, res) => {
try {
    const { id, kbId } = req.params;
    const { close_ticket } = req.body;

    const [ticketRows] = await db.execute('SELECT * FROM tickets WHERE id = ?', [id]);
    if (!ticketRows.length) return res.status(404).json({ message: 'Ticket not found' });

    const [kbRows] = await db.execute('SELECT * FROM knowledge_base WHERE id = ?', [kbId]);
    if (!kbRows.length) return res.status(404).json({ message: 'KB article not found' });

    const ticket = ticketRows[0];
    const kb = kbRows[0];

    // ← FIXED: using 'message' not 'comment'
    const commentText = `📚 Solution applied from Knowledge Base:\n\n**${kb.title}**\n\n${kb.solution}`;
    await db.execute('INSERT INTO comments (ticket_id, user_id, message) VALUES (?, ?, ?)', [id, req.user.id, commentText]);
    await db.execute('UPDATE knowledge_base SET times_used = times_used + 1 WHERE id = ?', [kbId]);
    await db.execute('INSERT INTO notifications (user_id, message) VALUES (?, ?)',
    [ticket.user_id, `A solution has been applied to your ticket "${ticket.title}" from our knowledge base.`]
    );
    await db.execute(
    'INSERT INTO ticket_logs (ticket_id, changed_by, old_status, new_status, note) VALUES (?, ?, ?, ?, ?)',
    [id, req.user.id, ticket.status, ticket.status, `KB solution applied — Article #${kbId}: "${kb.title}"`]
    );

    if (close_ticket === true || close_ticket === 'true') {
    await db.execute('UPDATE tickets SET status = ?, resolved_at = NOW() WHERE id = ?', ['pending_verification', id]);
    await db.execute(
        'INSERT INTO ticket_logs (ticket_id, changed_by, old_status, new_status, note) VALUES (?, ?, ?, ?, ?)',
        [id, req.user.id, ticket.status, 'pending_verification', 'Ticket moved to pending verification after KB solution applied']
    );
    await db.execute('INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [ticket.user_id, `Your ticket "${ticket.title}" has been resolved using a knowledge base solution. Please confirm if your issue is fixed.`]
    );
    return res.json({ success: true, message: 'KB solution applied and ticket moved to pending verification.', kb_article: kb.title, ticket_status: 'pending_verification' });
    }

    res.json({ success: true, message: 'KB solution applied as comment successfully.', kb_article: kb.title, ticket_status: ticket.status });
} catch (error) {
    console.error('Apply solution error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};