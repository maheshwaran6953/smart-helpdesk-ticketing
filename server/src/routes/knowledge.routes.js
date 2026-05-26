const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');

router.get('/', authenticate, (req, res) => {
  res.json({ message: 'Get KB articles - coming soon' });
});

module.exports = router;