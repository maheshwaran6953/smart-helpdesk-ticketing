const express = require('express');
const router = express.Router();
const knowledgeController = require('../controllers/knowledge.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/', authenticate, knowledgeController.getKBArticles);
router.get('/:id', authenticate, knowledgeController.getKBById);
router.post('/search', authenticate, knowledgeController.searchKB);
router.post('/apply', authenticate, knowledgeController.applyKBToTicket);

module.exports = router;