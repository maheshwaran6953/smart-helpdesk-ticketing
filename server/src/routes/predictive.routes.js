const express = require('express');
const router = express.Router();
const {
    getAllBreachRisks,
    getTicketBreachRisk,
    getAgentBurnout,
    getAllAgentBurnout,
    getVolumeForecast
} = require('../controllers/predictive.controller');

const protect = require('../middleware/auth.middleware');
const allowRoles = require('../middleware/role.middleware');

router.get('/breach-risk', protect, allowRoles('admin', 'agent'), getAllBreachRisks);
router.get('/breach-risk/:ticketId', protect, allowRoles('admin', 'agent'), getTicketBreachRisk);

router.get('/burnout', protect, allowRoles('admin', 'agent'), getAllAgentBurnout);
router.get('/burnout/:agentId', protect, allowRoles('admin', 'agent'), getAgentBurnout);

router.get('/forecast', protect, allowRoles('admin', 'agent'), getVolumeForecast);

module.exports = router;