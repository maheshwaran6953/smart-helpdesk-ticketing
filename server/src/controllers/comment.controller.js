const { Comment, Ticket, User } = require('../models');

// Get all comments for a ticket
exports.getComments = async (req, res) => {
  try {
    const { id: ticketId } = req.params;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const comments = await Comment.find({ ticketId })
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      ticketId,
      count: comments.length,
      comments
    });
  } catch (error) {
    console.error('Get comments error:', error.message);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

// Create comment on a ticket
exports.createComment = async (req, res) => {
  try {
    const { id: ticketId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const comment = new Comment({
      ticketId,
      userId,
      message
    });

    await comment.save();
    await comment.populate('userId', 'name email role');

    res.status(201).json({
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    console.error('Create comment error:', error.message);
    res.status(500).json({ error: 'Failed to create comment' });
  }
};

module.exports = exports;