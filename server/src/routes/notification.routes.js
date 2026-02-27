const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const verifyToken = require('../middleware/auth.middleware');

// All notification routes require login
router.use(verifyToken);

// Get all notifications for logged in user
router.get('/', notificationController.getNotifications);

// Mark all notifications as read
router.patch('/read-all', notificationController.markAllRead);

// Mark single notification as read
router.patch('/:id/read', notificationController.markOneRead);

module.exports = router;