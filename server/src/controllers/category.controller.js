const db = require('../config/db');

exports.getCategories = async (req, res) => {
try {
    const [categories] = await db.execute(
    'SELECT * FROM categories ORDER BY name'
    );
    res.status(200).json({ categories });
} catch (error) {
    console.error('Get categories error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};

exports.getCategoryById = async (req, res) => {
try {
    const { id } = req.params;
    const [rows] = await db.execute(
    'SELECT * FROM categories WHERE id = ?', [id]
    );
    if (!rows.length) {
    return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json({ category: rows[0] });
} catch (error) {
    console.error('Get category error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
}
};