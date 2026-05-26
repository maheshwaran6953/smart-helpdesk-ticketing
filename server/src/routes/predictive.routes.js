const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');

router.get('/breach-risk', authenticate, (req, res) => {
  res.json({ message: 'Get breach risk - coming soon' });
});

module.exports = router;