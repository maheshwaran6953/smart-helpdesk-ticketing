const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let token = '';
let userId = '';
let ticketId = '';
let categoryId = '';
let agentId = '';
let kbId = '';

const api = axios.create({
  baseURL: API_URL,
  validateStatus: () => true // Don't throw on any status
});

// Test helper
const test = (name, pass) => {
  console.log(pass ? `✅ ${name}` : `❌ ${name}`);
  return pass;
};

const main = async () => {
  console.log('\n🚀 Starting Phase 3.1 — Unit Testing\n');

  let passed = 0;
  let failed = 0;

  try {
    // ==================== AUTH TESTS ====================
    console.log('📋 AUTH ENDPOINTS\n');
    
    // Register
    const testEmail = `test${Date.now()}@example.com`;
    let res = await api.post('/auth/register', {
        name: 'Test User',
        email: testEmail,  // Use the stored email
        password: 'test123',
        role: 'user'
      });
      if (test('Register user', res.status === 201)) {
        token = res.data.token;
        userId = res.data.user.id;
        passed++;
      } else failed++;
      
      // Login - use the SAME email
      res = await api.post('/auth/login', {
        email: testEmail,  // Use the same stored email, NOT Date.now() - 1
        password: 'test123'
      });
      if (test('Login user', res.status === 200 && res.data.token)) {
        token = res.data.token;
        passed++;
      } else failed++;

    // ==================== TICKET TESTS ====================
    console.log('\n📋 TICKET ENDPOINTS\n');

    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Create ticket
    res = await api.post('/tickets', {
      title: 'Test ticket for automated testing',
      description: 'This is an automated test ticket',
      priority: 'high'
    });
    if (test('Create ticket', res.status === 201)) {
      ticketId = res.data.ticket._id;
      passed++;
    } else failed++;

    // Get all tickets
    res = await api.get('/tickets');
    if (test('Get all tickets', res.status === 200 && res.data.tickets.length > 0)) {
      passed++;
    } else failed++;

    // Get single ticket
    res = await api.get(`/tickets/${ticketId}`);
    if (test('Get single ticket', res.status === 200 && res.data.ticket._id)) {
      passed++;
    } else failed++;

    // Update ticket
    res = await api.put(`/tickets/${ticketId}`, {
      title: 'Updated title',
      description: 'Updated description'
    });
    if (test('Update ticket', res.status === 200)) {
      passed++;
    } else failed++;

    // Change status
    res = await api.patch(`/tickets/${ticketId}/status`, {
      status: 'in_progress'
    });
    if (test('Change ticket status', res.status === 200)) {
      passed++;
    } else failed++;

    // Suggest priority
    res = await api.post('/tickets/suggest-priority', {
      description: 'System is down and critical emergency'
    });
    if (test('Suggest priority (AI)', res.status === 200 && res.data.suggestedPriority)) {
      passed++;
    } else failed++;

    // Check duplicate
    res = await api.post('/tickets/check-duplicate', {
      description: 'Test ticket for automated testing'
    });
    if (test('Check duplicate', res.status === 200)) {
      passed++;
    } else failed++;

    // Get KB suggestions
    res = await api.get(`/tickets/${ticketId}/kb-suggestions`);
    if (test('Get KB suggestions', res.status === 200)) {
      passed++;
    } else failed++;

    // ==================== COMMENT TESTS ====================
    console.log('\n📋 COMMENT ENDPOINTS\n');

    // Create comment
    res = await api.post(`/tickets/${ticketId}/comments`, {
      message: 'This is a test comment'
    });
    if (test('Create comment', res.status === 201)) {
      passed++;
    } else failed++;

    // Get comments
    res = await api.get(`/tickets/${ticketId}/comments`);
    if (test('Get comments', res.status === 200 && Array.isArray(res.data.comments))) {
      passed++;
    } else failed++;

    // ==================== NOTIFICATION TESTS ====================
    console.log('\n📋 NOTIFICATION ENDPOINTS\n');

    // Get notifications
    res = await api.get('/notifications');
    if (test('Get notifications', res.status === 200)) {
      passed++;
    } else failed++;

    // Mark all as read
    res = await api.patch('/notifications/read-all');
    if (test('Mark all notifications as read', res.status === 200)) {
      passed++;
    } else failed++;

    // ==================== CATEGORY TESTS ====================
    console.log('\n📋 CATEGORY ENDPOINTS\n');

    // Get categories
    res = await api.get('/categories');
    if (test('Get all categories', res.status === 200 && res.data.categories.length > 0)) {
      categoryId = res.data.categories[0]._id;
      passed++;
    } else failed++;

    // Get single category
    if (categoryId) {
      res = await api.get(`/categories/${categoryId}`);
      if (test('Get single category', res.status === 200)) {
        passed++;
      } else failed++;
    }

    // ==================== ADMIN TESTS ====================
    console.log('\n📋 ADMIN ENDPOINTS\n');

    // Dashboard
    res = await api.get('/admin/dashboard');
    if (test('Get admin dashboard', res.status === 200 && res.data.dashboard)) {
      passed++;
    } else failed++;

    // Get users
    res = await api.get('/admin/users');
    if (test('Get all users', res.status === 200 && res.data.users.length > 0)) {
      passed++;
    } else failed++;

    // Get audit logs
    res = await api.get('/admin/audit-logs');
    if (test('Get audit logs', res.status === 200)) {
      passed++;
    } else failed++;

    // ==================== KNOWLEDGE BASE TESTS ====================
    console.log('\n📋 KNOWLEDGE BASE ENDPOINTS\n');

    // Get KB articles
    res = await api.get('/knowledge');
    if (test('Get KB articles', res.status === 200 && res.data.articles.length > 0)) {
      kbId = res.data.articles[0]._id;
      passed++;
    } else failed++;

    // Get single article
    if (kbId) {
      res = await api.get(`/knowledge/${kbId}`);
      if (test('Get single KB article', res.status === 200)) {
        passed++;
      } else failed++;
    }

    // Search KB
    res = await api.post('/knowledge/search', {
      query: 'restart'
    });
    if (test('Search KB articles', res.status === 200)) {
      passed++;
    } else failed++;

    // Apply KB
    if (kbId && ticketId) {
      res = await api.post('/knowledge/apply', {
        ticketId,
        kbId
      });
      if (test('Apply KB solution to ticket', res.status === 201)) {
        passed++;
      } else failed++;
    }

    // ==================== PREDICTIVE TESTS ====================
    console.log('\n📋 PREDICTIVE ENDPOINTS\n');

    // Get breach risk
    res = await api.get('/predictive/breach-risk');
    if (test('Get breach risk for all tickets', res.status === 200)) {
      passed++;
    } else failed++;

    // Get breach risk by ID
    if (ticketId) {
      res = await api.get(`/predictive/breach-risk/${ticketId}`);
      if (test('Get breach risk for single ticket', res.status === 200)) {
        passed++;
      } else failed++;
    }

    // Get agent burnout
    res = await api.get('/predictive/burnout');
    if (test('Get agent burnout scores', res.status === 200)) {
      passed++;
    } else failed++;

    // Get forecast
    res = await api.get('/predictive/forecast');
    if (test('Get volume forecast', res.status === 200)) {
      passed++;
    } else failed++;

    // ==================== EXPORT TESTS ====================
    console.log('\n📋 EXPORT ENDPOINTS\n');

    // Export CSV
    res = await api.get('/admin/export/csv');
    if (test('Export tickets as CSV', res.status === 200)) {
      passed++;
    } else failed++;

    // Export JSON
    res = await api.get('/admin/export/json');
    if (test('Export tickets as JSON', res.status === 200)) {
      passed++;
    } else failed++;

    // Export agent report
    res = await api.get('/admin/export/agent-report');
    if (test('Export agent report', res.status === 200)) {
      passed++;
    } else failed++;

    // ==================== SUMMARY ====================
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📊 SUMMARY`);
    console.log(`${'='.repeat(50)}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
    console.log(`${'='.repeat(50)}\n`);

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Test error:', error.message);
    process.exit(1);
  }
};

main();