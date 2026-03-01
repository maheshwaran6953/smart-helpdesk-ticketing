const db = require('../config/db');
const { findSimilarTickets } = require('../utils/duplicateDetection');

// CREATE KNOWLEDGE ARTICLE — Agent and Admin only
exports.createArticle = async (req, res) => {
try {
    const { title, category_id, problem_description, solution } = req.body;

    if (!title || !problem_description || !solution) {
    return res.status(400).json({ 
        message: 'Title, problem description and solution are required' 
    });
    }

    const [result] = await db.execute(`
    INSERT INTO knowledge_base 
    (title, category_id, problem_description, solution, created_by)
    VALUES (?, ?, ?, ?, ?)`,
    [title, category_id || null, problem_description, solution, req.user.id]
    );

    res.status(201).json({
    message: 'Knowledge article created successfully',
    article: {
        id: result.insertId,
        title,
        category_id,
        problem_description,
        solution,
        created_by: req.user.id
    }
    });

} catch (error) {
    console.error('Create article error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};

// GET ALL KNOWLEDGE ARTICLES
exports.getAllArticles = async (req, res) => {
try {
    const [articles] = await db.execute(`
    SELECT 
        kb.*,
        c.name AS category_name,
        u.name AS created_by_name
    FROM knowledge_base kb
    LEFT JOIN categories c ON kb.category_id = c.id
    LEFT JOIN users u ON kb.created_by = u.id
    ORDER BY kb.times_used DESC
    `);

    res.status(200).json({ articles });

} catch (error) {
    console.error('Get articles error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};

// SEARCH KNOWLEDGE BASE — finds articles similar to a ticket description
exports.searchArticles = async (req, res) => {
try {
    const { description } = req.body;

    if (!description) {
    return res.status(400).json({ message: 'Description is required' });
    }

    // Get all knowledge articles
    const [articles] = await db.execute(`
    SELECT 
        kb.*,
        c.name AS category_name,
        u.name AS created_by_name
    FROM knowledge_base kb
    LEFT JOIN categories c ON kb.category_id = c.id
    LEFT JOIN users u ON kb.created_by = u.id
    `);

    if (articles.length === 0) {
    return res.status(200).json({
        found: false,
        message: 'No knowledge articles available yet',
        articles: []
    });
    }

    // Use duplicate detection logic to find similar articles
    // We treat each article's problem_description like a ticket description
    const articlesAsTickets = articles.map(a => ({
    id: a.id,
    title: a.title,
    description: a.problem_description,
    status: 'article',
    created_at: a.created_at
    }));

    const similarArticles = findSimilarTickets(description, articlesAsTickets, 0.2);

    if (similarArticles.length === 0) {
    return res.status(200).json({
        found: false,
        message: 'No matching knowledge articles found',
        articles: []
    });
    }

    // Get full article details for matched articles
    const matchedIds = similarArticles.map(a => a.id);
    const fullArticles = articles
    .filter(a => matchedIds.includes(a.id))
    .map(a => ({
        ...a,
        similarity_score: similarArticles.find(s => s.id === a.id).similarity_score
    }))
    .sort((a, b) => b.similarity_score - a.similarity_score);

    res.status(200).json({
    found: true,
    message: `Found ${fullArticles.length} relevant knowledge article(s)`,
    articles: fullArticles
    });

} catch (error) {
    console.error('Search articles error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};

// MARK ARTICLE AS USED — increments times_used counter
exports.markArticleUsed = async (req, res) => {
try {
    const { id } = req.params;

    await db.execute(
    'UPDATE knowledge_base SET times_used = times_used + 1 WHERE id = ?',
    [id]
    );

    res.status(200).json({ message: 'Article marked as used' });

} catch (error) {
    console.error('Mark used error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};

// GET SINGLE ARTICLE BY ID
exports.getArticleById = async (req, res) => {
try {
    const { id } = req.params;

    const [rows] = await db.execute(`
    SELECT 
        kb.*,
        c.name AS category_name,
        u.name AS created_by_name
    FROM knowledge_base kb
    LEFT JOIN categories c ON kb.category_id = c.id
    LEFT JOIN users u ON kb.created_by = u.id
    WHERE kb.id = ?
    `, [id]);

    if (!rows.length) {
    return res.status(404).json({ message: 'Article not found' });
    }

    res.status(200).json({ article: rows[0] });

} catch (error) {
    console.error('Get article error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};