const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const verifyToken = require('../middleware/auth.middleware');
const allowRoles = require('../middleware/role.middleware');
const suggestPriority = require('../utils/prioritySuggestion');
const { findSimilarTickets } = require('../utils/duplicateDetection');
const db = require('../config/db');

// All ticket routes require login
router.use(verifyToken);

// Suggest priority based on description
router.post('/suggest-priority', (req, res) => {
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ message: 'Description is required' });
  }

  const suggested_priority = suggestPriority(description);

  res.status(200).json({
    suggested_priority,
    message: `Based on your description, we suggest priority: ${suggested_priority.toUpperCase()}`
  });
});

// Check for duplicate tickets
router.post('/check-duplicate', async (req, res) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ message: 'Description is required' });
    }

    // Get all open and in_progress tickets
    const [existingTickets] = await db.execute(`
      SELECT id, title, description, status, created_at
      FROM tickets
      WHERE status IN ('open', 'in_progress')
    `);

    const similarTickets = findSimilarTickets(description, existingTickets);

    if (similarTickets.length === 0) {
      return res.status(200).json({
        has_duplicates: false,
        message: 'No similar tickets found',
        similar_tickets: []
      });
    }

    res.status(200).json({
      has_duplicates: true,
      message: `Found ${similarTickets.length} similar ticket(s). Consider linking instead of creating new.`,
      similar_tickets: similarTickets
    });

  } catch (error) {
    console.error('Duplicate check error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a ticket — any logged in user
router.post('/', allowRoles('user', 'admin'), ticketController.createTicket);

// Get all tickets — role based
router.get('/', ticketController.getAllTickets);

// Get single ticket by ID
router.get('/:id', ticketController.getTicketById);

// Update ticket status — agent and admin only
router.patch('/:id/status', allowRoles('agent', 'admin'), ticketController.updateTicketStatus);

// Two-Way Closure Handshake — user confirms or rejects resolution
router.post('/:id/verify', allowRoles('user'), ticketController.verifyTicketClosure);

// Manual reassign — admin only
router.patch('/:id/reassign', allowRoles('admin'), ticketController.reassignTicket);

// KB Suggestions for a ticket
router.get('/:id/kb-suggestions', allowRoles('agent', 'admin'), ticketController.getKBSuggestions);

// Apply KB solution to ticket
router.post('/:id/apply-solution/:kbId', allowRoles('agent', 'admin'), ticketController.applySolution);

module.exports = router;