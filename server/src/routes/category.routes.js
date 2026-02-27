const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const verifyToken = require('../middleware/auth.middleware');

router.use(verifyToken);

router.get('/', categoryController.getCategories);

router.get('/:id', categoryController.getCategoryById);

module.exports = router;