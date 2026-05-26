const { Ticket, User, Comment, AuditLog, KB, TicketKBUsage } = require('../models');

// Helper: Generate ticket ID (e.g., #001, #002)
const generateTicketId = async () => {
  const count = await Ticket.countDocuments();
  return `#${String(count + 1).padStart(3, '0')}`;
};

// Helper: Calculate SLA deadline based on priority
const calculateSLADeadline = (priority) => {
  const now = new Date();
  const hours = {
    critical: 2,
    high: 4,
    medium: 8,
    low: 24
  };
  return new Date(now.getTime() + (hours[priority] || 24) * 60 * 60 * 1000);
};

// 1. CREATE TICKET
exports.createTicket = async (req, res) => {
  try {
    const { title, description, priority, categoryId } = req.body;
    const userId = req.user.id; // From JWT middleware

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description required' });
    }

    // Generate ticket ID
    const ticketId = await generateTicketId();

    // Calculate SLA deadline
    const slaDeadline = calculateSLADeadline(priority);

    // Create ticket
    const ticket = new Ticket({
      ticketId,
      title,
      description,
      priority: priority || 'medium',
      categoryId: categoryId || null,
      userId,
      slaDeadline,
      status: 'open'
    });

    await ticket.save();

    // Create audit log
    await AuditLog.create({
      ticketId: ticket._id,
      userId,
      action: 'created',
      details: { title, description, priority }
    });

    res.status(201).json({
      message: 'Ticket created successfully',
      ticket
    });
  } catch (error) {
    console.error('Create ticket error:', error.message);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
};

// 2. GET ALL TICKETS
exports.getAllTickets = async (req, res) => {
  try {
    const { priority, status, search } = req.query;

    // Build filter
    let filter = { status: { $ne: 'closed' } };

    if (priority) filter.priority = priority;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch tickets with populated references
    const tickets = await Ticket.find(filter)
      .populate('userId', 'name email')
      .populate('assignedAgentId', 'name email')
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: tickets.length,
      tickets
    });
  } catch (error) {
    console.error('Get all tickets error:', error.message);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
};

// 3. GET SINGLE TICKET
exports.getTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findById(id)
      .populate('userId', 'name email')
      .populate('assignedAgentId', 'name email')
      .populate('categoryId', 'name');

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.status(200).json({ ticket });
  } catch (error) {
    console.error('Get ticket error:', error.message);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
};

// 4. UPDATE TICKET
exports.updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, categoryId } = req.body;
    const userId = req.user.id;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Update fields
    if (title) ticket.title = title;
    if (description) ticket.description = description;
    if (priority) ticket.priority = priority;
    if (categoryId) ticket.categoryId = categoryId;

    await ticket.save();

    // Create audit log
    await AuditLog.create({
      ticketId: ticket._id,
      userId,
      action: 'status_changed',
      details: { oldTitle: ticket.title, newTitle: title }
    });

    res.status(200).json({
      message: 'Ticket updated successfully',
      ticket
    });
  } catch (error) {
    console.error('Update ticket error:', error.message);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
};

// 5. CHANGE TICKET STATUS
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!['open', 'in_progress', 'pending_verification', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const oldStatus = ticket.status;
    ticket.status = status;

    if (status === 'resolved') {
      ticket.resolvedAt = new Date();
    } else if (status === 'closed') {
      ticket.closedAt = new Date();
    }

    await ticket.save();

    // Create audit log
    await AuditLog.create({
      ticketId: ticket._id,
      userId,
      action: 'status_changed',
      details: { oldStatus, newStatus: status }
    });

    res.status(200).json({
      message: 'Status updated successfully',
      ticket
    });
  } catch (error) {
    console.error('Update status error:', error.message);
    res.status(500).json({ error: 'Failed to update status' });
  }
};

// 6. REASSIGN TICKET TO AGENT
exports.reassignTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedAgentId, note } = req.body;
    const userId = req.user.id;

    if (!assignedAgentId) {
      return res.status(400).json({ error: 'Agent ID required' });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Verify agent exists and has role 'agent'
    const agent = await User.findById(assignedAgentId);
    if (!agent || agent.role !== 'agent') {
      return res.status(400).json({ error: 'Invalid agent' });
    }

    const oldAgentId = ticket.assignedAgentId;
    ticket.assignedAgentId = assignedAgentId;
    await ticket.save();

    // Create audit log
    await AuditLog.create({
      ticketId: ticket._id,
      userId,
      action: 'assigned',
      details: { oldAgentId, newAgentId: assignedAgentId, note }
    });

    res.status(200).json({
      message: 'Ticket reassigned successfully',
      ticket
    });
  } catch (error) {
    console.error('Reassign ticket error:', error.message);
    res.status(500).json({ error: 'Failed to reassign ticket' });
  }
};

// 7. VERIFY RESOLUTION (User confirms fix)
exports.verifyResolution = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.status !== 'pending_verification') {
      return res.status(400).json({ error: 'Ticket is not pending verification' });
    }

    ticket.status = 'resolved';
    ticket.resolvedAt = new Date();
    await ticket.save();

    // Create audit log
    await AuditLog.create({
      ticketId: ticket._id,
      userId,
      action: 'resolved',
      details: { verifiedBy: userId }
    });

    res.status(200).json({
      message: 'Resolution verified successfully',
      ticket
    });
  } catch (error) {
    console.error('Verify resolution error:', error.message);
    res.status(500).json({ error: 'Failed to verify resolution' });
  }
};

// 8. REJECT RESOLUTION (User says still having issues)
exports.rejectResolution = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.status !== 'pending_verification') {
      return res.status(400).json({ error: 'Ticket is not pending verification' });
    }

    ticket.status = 'in_progress';
    await ticket.save();

    // Create audit log
    await AuditLog.create({
      ticketId: ticket._id,
      userId,
      action: 'reopened',
      details: { reason, rejectedBy: userId }
    });

    res.status(200).json({
      message: 'Resolution rejected, ticket reopened',
      ticket
    });
  } catch (error) {
    console.error('Reject resolution error:', error.message);
    res.status(500).json({ error: 'Failed to reject resolution' });
  }
};

// 9. SUGGEST PRIORITY (AI - NLP)
exports.suggestPriority = async (req, res) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description required' });
    }

    // Simple NLP keyword-based priority suggestion
    const keywords = {
      critical: ['crash', 'down', 'error', 'urgent', 'critical', 'emergency', 'not working'],
      high: ['slow', 'issue', 'problem', 'help', 'important'],
      medium: ['question', 'feature', 'update'],
      low: ['suggestion', 'info', 'minor']
    };

    const text = description.toLowerCase();
    let suggestedPriority = 'medium'; // default
    let score = 0;

    for (const [priority, words] of Object.entries(keywords)) {
      const matches = words.filter(word => text.includes(word)).length;
      if (matches > score) {
        score = matches;
        suggestedPriority = priority;
      }
    }

    res.status(200).json({
      suggestedPriority,
      confidence: score > 0 ? Math.min((score / 3) * 100, 100) : 0
    });
  } catch (error) {
    console.error('Suggest priority error:', error.message);
    res.status(500).json({ error: 'Failed to suggest priority' });
  }
};

// 10. CHECK DUPLICATE (Jaccard Similarity)
exports.checkDuplicate = async (req, res) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description required' });
    }

    // Get all open tickets
    const openTickets = await Ticket.find({ status: { $ne: 'closed' } });

    // Jaccard similarity function
    const jaccard = (str1, str2) => {
      const set1 = new Set(str1.toLowerCase().split(/\s+/));
      const set2 = new Set(str2.toLowerCase().split(/\s+/));
      const intersection = new Set([...set1].filter(x => set2.has(x)));
      const union = new Set([...set1, ...set2]);
      return intersection.size / union.size;
    };

    // Find similar tickets
    const similarities = openTickets
      .map(ticket => ({
        ticketId: ticket.ticketId,
        title: ticket.title,
        similarity: jaccard(description, ticket.description)
      }))
      .filter(item => item.similarity > 0.7)
      .sort((a, b) => b.similarity - a.similarity);

    res.status(200).json({
      hasDuplicate: similarities.length > 0,
      similarTickets: similarities.slice(0, 5)
    });
  } catch (error) {
    console.error('Check duplicate error:', error.message);
    res.status(500).json({ error: 'Failed to check duplicates' });
  }
};

// 11. GET KB SUGGESTIONS
exports.getKBSuggestions = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Get all KB articles
    const kbArticles = await KB.find();

    // Jaccard similarity
    const jaccard = (str1, str2) => {
      const set1 = new Set(str1.toLowerCase().split(/\s+/));
      const set2 = new Set(str2.toLowerCase().split(/\s+/));
      const intersection = new Set([...set1].filter(x => set2.has(x)));
      const union = new Set([...set1, ...set2]);
      return intersection.size / union.size;
    };

    // Find matching KB articles
    const suggestions = kbArticles
      .map(article => ({
        _id: article._id,
        title: article.title,
        content: article.content.substring(0, 200), // Preview
        similarity: jaccard(ticket.description, article.content)
      }))
      .filter(item => item.similarity > 0.5)
      .sort((a, b) => b.similarity - a.similarity);

    res.status(200).json({
      ticketId: ticket._id,
      suggestions: suggestions.slice(0, 5)
    });
  } catch (error) {
    console.error('Get KB suggestions error:', error.message);
    res.status(500).json({ error: 'Failed to get KB suggestions' });
  }
};

module.exports = exports;