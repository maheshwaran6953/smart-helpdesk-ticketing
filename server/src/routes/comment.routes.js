const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate } = require('../middleware/auth.middleware');

// Routes will be implemented in Phase 2.3
// For now, just prevent errors

router.get('/', authenticate, (req, res) => {
  res.json({ message: 'Get comments endpoint - coming soon' });
});

router.post('/', authenticate, (req, res) => {
  res.json({ message: 'Create comment endpoint - coming soon' });
});

module.exports = router;