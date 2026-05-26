const express = require('express');
const router = express.Router({ mergeParams: true });
const commentController = require('../controllers/comment.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Get all comments for a ticket
router.get('/', authenticate, commentController.getComments);

// Create comment
router.post('/', authenticate, commentController.createComment);

module.exports = router;