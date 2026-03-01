const express = require('express');
const router = express.Router();
const knowledgeController = require('../controllers/knowledge.controller');
const verifyToken = require('../middleware/auth.middleware');
const allowRoles = require('../middleware/role.middleware');

// All knowledge routes require login
router.use(verifyToken);

// Search knowledge base — all roles can search
router.post('/search', knowledgeController.searchArticles);

// Get all articles — all roles can view
router.get('/', knowledgeController.getAllArticles);

// Get single article
router.get('/:id', knowledgeController.getArticleById);

// Create article — agent and admin only
router.post('/', allowRoles('agent', 'admin'), knowledgeController.createArticle);

// Mark article as used — agent and admin only
router.patch('/:id/used', allowRoles('agent', 'admin'), knowledgeController.markArticleUsed);

module.exports = router;