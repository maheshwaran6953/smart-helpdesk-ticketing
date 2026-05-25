const mongoose = require('mongoose');

const ticketKbUsageSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
  },
  kbId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KB',
    required: true
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('TicketKBUsage', ticketKbUsageSchema);