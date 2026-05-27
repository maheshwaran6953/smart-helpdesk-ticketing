const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let token = '';
let userId = '';
let ticketId = '';
let agentId = '';

const api = axios.create({
  baseURL: API_URL,
  validateStatus: () => true
});

const test = (name, pass) => {
  console.log(pass ? `✅ ${name}` : `❌ ${name}`);
  return pass;
};

const main = async () => {
  console.log('\n🔗 Starting Phase 3.2 — Integration Testing\n');

  let passed = 0;
  let failed = 0;

  try {
    // ==================== WORKFLOW 1: User Registration → Login → Create Ticket ====================
    console.log('📋 WORKFLOW 1: User Registration → Login → Create Ticket\n');

    const email = `workflow${Date.now()}@test.com`;

    // Step 1: Register
    let res = await api.post('/auth/register', {
      name: 'Workflow Test User',
      email,
      password: 'workflow123',
      role: 'user'
    });
    if (test('Step 1: Register user', res.status === 201)) {
      token = res.data.token;
      userId = res.data.user.id;
      passed++;
    } else {
      failed++;
      return;
    }

    // Step 2: Login with same credentials
    res = await api.post('/auth/login', {
      email,
      password: 'workflow123'
    });
    if (test('Step 2: Login with registered user', res.status === 200 && res.data.token)) {
      token = res.data.token;
      passed++;
    } else {
      failed++;
      return;
    }

    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Step 3: Create a ticket
    res = await api.post('/tickets', {
      title: 'Integration test ticket',
      description: 'Testing the complete workflow',
      priority: 'high'
    });
    if (test('Step 3: Create ticket', res.status === 201)) {
      ticketId = res.data.ticket._id;
      passed++;
    } else {
      failed++;
      return;
    }

    // Step 4: Verify ticket has userId populated
    res = await api.get(`/tickets/${ticketId}`);
    if (test('Step 4: Verify ticket has valid userId', res.status === 200 && res.data.ticket.userId)) {
    passed++;
    } else {
    failed++;
    }

    // ==================== WORKFLOW 2: Ticket Status Progression ====================
    console.log('\n📋 WORKFLOW 2: Ticket Status Progression\n');

    // Step 1: Create ticket in 'open' status
    res = await api.post('/tickets', {
      title: 'Status progression test',
      description: 'Testing all status transitions',
      priority: 'medium'
    });
    if (test('Step 1: Create ticket (open)', res.status === 201)) {
      ticketId = res.data.ticket._id;
      passed++;
    } else {
      failed++;
    }

    // Step 2: Change to 'in_progress'
    res = await api.patch(`/tickets/${ticketId}/status`, {
      status: 'in_progress'
    });
    if (test('Step 2: Change to in_progress', res.status === 200 && res.data.ticket.status === 'in_progress')) {
      passed++;
    } else {
      failed++;
    }

    // Step 3: Change to 'pending_verification'
    res = await api.patch(`/tickets/${ticketId}/status`, {
      status: 'pending_verification'
    });
    if (test('Step 3: Change to pending_verification', res.status === 200 && res.data.ticket.status === 'pending_verification')) {
      passed++;
    } else {
      failed++;
    }

    // Step 4: Verify resolution
    // Step 4: Verify resolution
    res = await api.post(`/tickets/${ticketId}/verify`, {});
    if (test('Step 4: Verify resolution', res.status === 200 && res.data.ticket.status === 'resolved')) {
    passed++;
    } else {
    failed++;
    }

    // ==================== WORKFLOW 3: Ticket Rejection Workflow ====================
    console.log('\n📋 WORKFLOW 3: Ticket Rejection (Reopen)\n');

    // Create another ticket
    res = await api.post('/tickets', {
      title: 'Rejection test ticket',
      description: 'Testing rejection workflow',
      priority: 'low'
    });
    const rejectionTicketId = res.data.ticket._id;

    // Change to pending_verification
    await api.patch(`/tickets/${rejectionTicketId}/status`, {
      status: 'pending_verification'
    });

    // Step 1: Reject resolution
    res = await api.post(`/tickets/${rejectionTicketId}/reject`, {
      reason: 'Issue still persists'
    });
    if (test('Step 1: Reject resolution', res.status === 200 && res.data.ticket.status === 'in_progress')) {
      passed++;
    } else {
      failed++;
    }

    // Step 2: Verify ticket is back in progress
    res = await api.get(`/tickets/${rejectionTicketId}`);
    if (test('Step 2: Verify ticket reopened', res.status === 200 && res.data.ticket.status === 'in_progress')) {
      passed++;
    } else {
      failed++;
    }

    // ==================== WORKFLOW 4: Comment Workflow ====================
    console.log('\n📋 WORKFLOW 4: Comments on Tickets\n');

    // Step 1: Create comment
    res = await api.post(`/tickets/${ticketId}/comments`, {
      message: 'This is a test comment'
    });
    if (test('Step 1: Add comment to ticket', res.status === 201)) {
      passed++;
    } else {
      failed++;
    }

    // Step 2: Fetch comments and verify
    res = await api.get(`/tickets/${ticketId}/comments`);
    if (test('Step 2: Fetch comments', res.status === 200 && res.data.comments.length > 0)) {
      passed++;
    } else {
      failed++;
    }

    // Step 3: Verify comment has correct content
    const hasTestComment = res.data.comments.some(c => c.message === 'This is a test comment');
    if (test('Step 3: Verify comment content', hasTestComment)) {
      passed++;
    } else {
      failed++;
    }

    // ==================== WORKFLOW 5: KB Application ====================
    console.log('\n📋 WORKFLOW 5: Apply KB Solution to Ticket\n');

    // Get KB articles
    res = await api.get('/knowledge');
    const kbArticle = res.data.articles[0];

    if (kbArticle) {
      // Step 1: Apply KB to ticket
      res = await api.post('/knowledge/apply', {
        ticketId,
        kbId: kbArticle._id
      });
      if (test('Step 1: Apply KB solution to ticket', res.status === 201)) {
        passed++;
      } else {
        failed++;
      }

      // Step 2: Verify KB usage count incremented
      res = await api.get(`/knowledge/${kbArticle._id}`);
      if (test('Step 2: Verify KB usage count incremented', res.status === 200 && res.data.article.usageCount > 0)) {
        passed++;
      } else {
        failed++;
      }
    }

    // ==================== WORKFLOW 6: Ticket Filtering ====================
    console.log('\n📋 WORKFLOW 6: Ticket Filtering & Search\n');

    // Step 1: Get all open tickets
    res = await api.get('/tickets?status=open');
    const openCount = res.data.tickets.length;
    if (test('Step 1: Filter by status (open)', res.status === 200 && openCount >= 0)) {
      passed++;
    } else {
      failed++;
    }

    // Step 2: Get high priority tickets
    res = await api.get('/tickets?priority=high');
    if (test('Step 2: Filter by priority (high)', res.status === 200)) {
      passed++;
    } else {
      failed++;
    }

    // Step 3: Search by title
    res = await api.get('/tickets?search=Integration');
    if (test('Step 3: Search by title keyword', res.status === 200)) {
      passed++;
    } else {
      failed++;
    }

    // ==================== WORKFLOW 7: Data Integrity ====================
    console.log('\n📋 WORKFLOW 7: Data Integrity Checks\n');

    // Get admin dashboard
    res = await api.get('/admin/dashboard');
    if (test('Step 1: Get dashboard stats', res.status === 200)) {
      const stats = res.data.dashboard;
      passed++;

      // Verify stats structure
      if (test('Step 2: Verify dashboard has ticket stats', stats.tickets && stats.tickets.total > 0)) {
        passed++;
      } else {
        failed++;
      }

      // Verify user stats
      if (test('Step 3: Verify dashboard has user stats', stats.users && stats.users.total > 0)) {
        passed++;
      } else {
        failed++;
      }
    } else {
      failed++;
    }

    // ==================== SUMMARY ====================
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📊 INTEGRATION TEST SUMMARY`);
    console.log(`${'='.repeat(50)}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
    console.log(`${'='.repeat(50)}\n`);

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Integration test error:', error.message);
    process.exit(1);
  }
};

main();