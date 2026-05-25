const mongoose = require('mongoose');

const kbSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  tags: [String],
  usageCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-update updatedAt — CORRECT VERSION
kbSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('KB', kbSchema);