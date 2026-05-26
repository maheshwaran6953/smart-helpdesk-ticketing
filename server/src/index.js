const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const ticketRoutes = require('./routes/ticket.routes');
const commentRoutes = require('./routes/comment.routes');
const notificationRoutes = require('./routes/notification.routes');
const categoryRoutes = require('./routes/category.routes');
const adminRoutes = require('./routes/admin.routes');
const knowledgeRoutes = require('./routes/knowledge.routes');
const startSLAEscalationJob = require('./jobs/sla.job');
const predictiveRoutes = require('./routes/predictive.routes');
const exportRoutes = require('./routes/export.routes');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/tickets/:id/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/predictive', predictiveRoutes);
app.use('/api/admin/export', exportRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'SmartDesk API is running on MongoDB!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log('🔄 Starting SLA escalation job...');
  startSLAEscalationJob();
});