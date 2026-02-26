const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const verifyToken = require('../middleware/auth.middleware');
const allowRoles = require('../middleware/role.middleware');

router.use(verifyToken);

router.post('/', allowRoles('user', 'admin'), ticketController.createTicket);

router.get('/', ticketController.getAllTickets);

router.get('/:id', ticketController.getTicketById);

router.patch('/:id/status', allowRoles('agent', 'admin'), ticketController.updateTicketStatus);

module.exports = router;