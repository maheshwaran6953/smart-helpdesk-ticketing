const express = require('express');
const router = express.Router();
const predictiveController = require('../controllers/predictive.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/breach-risk', authenticate, predictiveController.getBreachRisk);
router.get('/breach-risk/:id', authenticate, predictiveController.getBreachRiskById);
router.get('/burnout', authenticate, predictiveController.getAgentBurnout);
router.get('/forecast', authenticate, predictiveController.getVolumeForecast);

module.exports = router;