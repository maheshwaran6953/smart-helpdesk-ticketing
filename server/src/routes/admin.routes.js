const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');

router.get('/dashboard', authenticate, (req, res) => {
  res.json({ message: 'Admin dashboard - coming soon' });
});

module.exports = router;