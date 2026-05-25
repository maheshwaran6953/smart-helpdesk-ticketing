const mongoose = require('mongoose');
require('dotenv').config();
const { User, Ticket } = require('./models');

const testSchemas = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Test creating a user
    console.log('Creating test user...');
    const user = new User({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'user'
    });
    await user.save();
    console.log('✅ User schema works');

    // Test creating a ticket
    console.log('Creating test ticket...');
    const ticket = new Ticket({
      ticketId: '#001',
      title: 'Test Ticket',
      description: 'Test description',
      userId: user._id,
      priority: 'high'
    });
    await ticket.save();
    console.log('✅ Ticket schema works');

    console.log('✅ All schemas working correctly!');

    // Cleanup
    console.log('Cleaning up test data...');
    await User.deleteOne({ email: 'test@example.com' });
    await Ticket.deleteOne({ ticketId: '#001' });

    await mongoose.connection.close();
    console.log('✅ Connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Schema test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

testSchemas();