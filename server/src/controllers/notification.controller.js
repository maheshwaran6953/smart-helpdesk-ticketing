const { Notification } = require('../models');

// Get all notifications for user
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.find({ userId })
      .populate('ticketId', 'ticketId title')
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: notifications.length,
      notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error.message);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error.message);
    res.status(500).json({ error: 'Failed to mark notifications' });
  }
};

// Mark single as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.status(200).json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Mark as read error:', error.message);
    res.status(500).json({ error: 'Failed to mark notification' });
  }
};

module.exports = exports;