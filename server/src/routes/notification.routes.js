const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const verifyToken = require('../middleware/auth.middleware');

router.use(verifyToken);

router.get('/', notificationController.getNotifications);

router.patch('/read-all', notificationController.markAllRead);

router.patch('/:id/read', notificationController.markOneRead);

module.exports = router;