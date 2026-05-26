const express = require('express');
const router = express.Router();
const exportController = require('../controllers/export.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/csv', authenticate, exportController.exportCSV);
router.get('/json', authenticate, exportController.exportJSON);
router.get('/agent-report', authenticate, exportController.exportAgentReport);

module.exports = router;