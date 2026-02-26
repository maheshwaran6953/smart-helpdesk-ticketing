const express = require('express');
const router = express.Router({ mergeParams: true });
const commentController = require('../controllers/comment.controller');
const verifyToken = require('../middleware/auth.middleware');

router.use(verifyToken);

router.post('/', commentController.addComment);

router.get('/', commentController.getComments);

module.exports = router;