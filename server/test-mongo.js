const mongoose = require('mongoose');
require('dotenv').config();

const mongoURL = process.env.MONGODB_URI;

mongoose.connect(mongoURL)
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    console.log('Connected to:', mongoURL);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });