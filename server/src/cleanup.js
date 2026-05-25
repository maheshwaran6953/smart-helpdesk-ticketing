const mongoose = require('mongoose');
require('dotenv').config();
const { User, Ticket } = require('./models');

const cleanup = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Deleting test data...');
    
    await User.deleteOne({ email: 'test@example.com' });
    await Ticket.deleteOne({ ticketId: '#001' });
    
    console.log('✅ Test data cleaned up');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

cleanup();