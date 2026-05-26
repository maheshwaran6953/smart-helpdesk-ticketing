const { KB, TicketKBUsage } = require('../models');

// Get all KB articles
exports.getKBArticles = async (req, res) => {
  try {
    const articles = await KB.find().sort({ createdAt: -1 });

    res.status(200).json({
      count: articles.length,
      articles
    });
  } catch (error) {
    console.error('Get KB articles error:', error.message);
    res.status(500).json({ error: 'Failed to fetch KB articles' });
  }
};

// Get single KB article
exports.getKBById = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await KB.findById(id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.status(200).json({ article });
  } catch (error) {
    console.error('Get KB article error:', error.message);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
};

// Search KB articles
exports.searchKB = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const articles = await KB.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    });

    res.status(200).json({
      count: articles.length,
      articles
    });
  } catch (error) {
    console.error('Search KB error:', error.message);
    res.status(500).json({ error: 'Failed to search KB' });
  }
};

// Apply KB solution to ticket
exports.applyKBToTicket = async (req, res) => {
  try {
    const { ticketId, kbId } = req.body;

    const usage = new TicketKBUsage({
      ticketId,
      kbId
    });

    await usage.save();

    // Increment usage count
    await KB.findByIdAndUpdate(kbId, { $inc: { usageCount: 1 } });

    res.status(201).json({
      message: 'KB solution applied to ticket',
      usage
    });
  } catch (error) {
    console.error('Apply KB error:', error.message);
    res.status(500).json({ error: 'Failed to apply KB' });
  }
};

module.exports = exports;