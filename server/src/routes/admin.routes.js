const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/dashboard', authenticate, adminController.getDashboard);
router.get('/users', authenticate, adminController.getUsers);
router.get('/audit-logs', authenticate, adminController.getAuditLogs);

module.exports = router;