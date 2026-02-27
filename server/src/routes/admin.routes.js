const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const verifyToken = require('../middleware/auth.middleware');
const allowRoles = require('../middleware/role.middleware');

router.use(verifyToken);
router.use(allowRoles('admin'));

router.get('/dashboard', adminController.getDashboardStats);

router.get('/users', adminController.getAllUsers);

router.get('/tickets/:id/logs', adminController.getTicketLogs);

module.exports = router;