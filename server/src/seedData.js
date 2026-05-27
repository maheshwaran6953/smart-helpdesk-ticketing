const mongoose = require('mongoose');
require('dotenv').config();
const { User, Ticket, Comment, Category, KB, Notification } = require('./models');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Ticket.deleteMany({});
    await Comment.deleteMany({});
    await Category.deleteMany({});
    await KB.deleteMany({});
    await Notification.deleteMany({});
    console.log('Cleared existing data');

    // Create test users
    const admin = new User({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin'
    });
    await admin.save();

    const agent1 = new User({
      name: 'Agent One',
      email: 'agent1@test.com',
      password: 'agent123',
      role: 'agent'
    });
    await agent1.save();

    const agent2 = new User({
      name: 'Agent Two',
      email: 'agent2@test.com',
      password: 'agent123',
      role: 'agent'
    });
    await agent2.save();

    const user1 = new User({
      name: 'User One',
      email: 'user1@test.com',
      password: 'user123',
      role: 'user'
    });
    await user1.save();

    const user2 = new User({
      name: 'User Two',
      email: 'user2@test.com',
      password: 'user123',
      role: 'user'
    });
    await user2.save();

    console.log('✅ Created 5 users');

    // Create categories
    const categories = await Category.insertMany([
      { name: 'Hardware', description: 'Hardware related issues' },
      { name: 'Software', description: 'Software related issues' },
      { name: 'Network', description: 'Network related issues' },
      { name: 'Account', description: 'Account related issues' }
    ]);

    console.log('✅ Created 4 categories');

    // Create KB articles
    const kbArticles = await KB.insertMany([
      {
        title: 'How to restart your computer',
        content: 'Step 1: Click Start menu. Step 2: Click Power. Step 3: Click Restart.',
        tags: ['restart', 'basic', 'troubleshooting']
      },
      {
        title: 'Fix WiFi connection issues',
        content: 'Check if WiFi is enabled. Restart your router. Forget and reconnect to network.',
        tags: ['wifi', 'network', 'connectivity']
      },
      {
        title: 'Password reset instructions',
        content: 'Go to login page. Click Forgot Password. Follow email instructions.',
        tags: ['password', 'account', 'security']
      },
      {
        title: 'Software installation guide',
        content: 'Download installer. Run as administrator. Follow installation wizard.',
        tags: ['software', 'installation', 'setup']
      }
    ]);

    console.log('✅ Created 4 KB articles');

    // Create tickets
    const now = new Date();
    const tickets = await Ticket.insertMany([
      {
        ticketId: '#001',
        title: 'Laptop not turning on',
        description: 'My laptop will not power on, critical issue',
        priority: 'critical',
        status: 'open',
        userId: user1._id,
        assignedAgentId: agent1._id,
        categoryId: categories[0]._id,
        slaDeadline: new Date(now.getTime() + 2 * 60 * 60 * 1000)
      },
      {
        ticketId: '#002',
        title: 'WiFi keeps disconnecting',
        description: 'Internet connection drops frequently',
        priority: 'high',
        status: 'in_progress',
        userId: user2._id,
        assignedAgentId: agent2._id,
        categoryId: categories[2]._id,
        slaDeadline: new Date(now.getTime() + 4 * 60 * 60 * 1000)
      },
      {
        ticketId: '#003',
        title: 'Forgot password',
        description: 'Cannot remember my account password',
        priority: 'medium',
        status: 'open',
        userId: user1._id,
        categoryId: categories[3]._id,
        slaDeadline: new Date(now.getTime() + 8 * 60 * 60 * 1000)
      },
      {
        ticketId: '#004',
        title: 'Application crashes on startup',
        description: 'Software crashes immediately when launched',
        priority: 'high',
        status: 'pending_verification',
        userId: user2._id,
        assignedAgentId: agent1._id,
        categoryId: categories[1]._id,
        slaDeadline: new Date(now.getTime() + 4 * 60 * 60 * 1000),
        resolvedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000)
      }
    ]);

    console.log('✅ Created 4 tickets');

    // Create comments
    await Comment.insertMany([
      {
        ticketId: tickets[0]._id,
        userId: agent1._id,
        message: 'Trying to diagnose the issue. Have you tried force restarting?'
      },
      {
        ticketId: tickets[0]._id,
        userId: user1._id,
        message: 'Yes, I held the power button for 10 seconds but nothing happened.'
      },
      {
        ticketId: tickets[1]._id,
        userId: agent2._id,
        message: 'I have restarted your router. Please test the connection.'
      }
    ]);

    console.log('✅ Created 3 comments');

    // Create notifications
    await Notification.insertMany([
      {
        userId: user1._id,
        ticketId: tickets[0]._id,
        message: 'Your ticket #001 has been assigned to Agent One',
        type: 'ticket_assigned'
      },
      {
        userId: user2._id,
        ticketId: tickets[1]._id,
        message: 'Agent has added a comment to your ticket #002',
        type: 'ticket_commented'
      }
    ]);

    console.log('✅ Created 2 notifications');

    await mongoose.connection.close();
    console.log('✅ Seed data completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed data failed:', error.message);
    process.exit(1);
  }
};

seedData();