const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');

router.get('/csv', authenticate, (req, res) => {
  res.json({ message: 'Export CSV - coming soon' });
});

module.exports = router;