const { Category } = require('../models');

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });

    res.status(200).json({
      count: categories.length,
      categories
    });
  } catch (error) {
    console.error('Get categories error:', error.message);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Get single category
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.status(200).json({ category });
  } catch (error) {
    console.error('Get category error:', error.message);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
};

module.exports = exports;