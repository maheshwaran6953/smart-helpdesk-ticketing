const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Create ticket
router.post('/', authenticate, ticketController.createTicket);

// Get all tickets
router.get('/', authenticate, ticketController.getAllTickets);

// Get single ticket
router.get('/:id', authenticate, ticketController.getTicketById);

// Update ticket
router.put('/:id', authenticate, ticketController.updateTicket);

// Change status
router.patch('/:id/status', authenticate, ticketController.updateStatus);

// Reassign ticket
router.patch('/:id/reassign', authenticate, ticketController.reassignTicket);

// Verify resolution
router.post('/:id/verify', authenticate, ticketController.verifyResolution);

// Reject resolution
router.post('/:id/reject', authenticate, ticketController.rejectResolution);

// Suggest priority (AI)
router.post('/suggest-priority', ticketController.suggestPriority);

// Check duplicate
router.post('/check-duplicate', ticketController.checkDuplicate);

// Get KB suggestions
router.get('/:id/kb-suggestions', authenticate, ticketController.getKBSuggestions);

module.exports = router;