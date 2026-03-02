const express = require('express');
const router = express.Router();
const { exportTicketsCSV, exportTicketsExcel, exportAgentsCSV } = require('../controllers/export.controller');
const protect = require('../middleware/auth.middleware');
const allowRoles = require('../middleware/role.middleware');

router.use(protect);
router.use(allowRoles('admin'));

router.get('/tickets', exportTicketsCSV);
router.get('/tickets/excel', exportTicketsExcel);
router.get('/agents', exportAgentsCSV);

module.exports = router;