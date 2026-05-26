# Phase 3 Testing Checklist

## Authentication (2 endpoints)
- [ ] POST /api/auth/register — Create new user
- [ ] POST /api/auth/login — Authenticate user

## Tickets (11 endpoints)
- [ ] POST /api/tickets — Create ticket
- [ ] GET /api/tickets — Get all tickets
- [ ] GET /api/tickets/:id — Get single ticket
- [ ] PUT /api/tickets/:id — Update ticket
- [ ] PATCH /api/tickets/:id/status — Change status
- [ ] PATCH /api/tickets/:id/reassign — Reassign to agent
- [ ] POST /api/tickets/:id/verify — Verify resolution
- [ ] POST /api/tickets/:id/reject — Reject resolution
- [ ] POST /api/tickets/suggest-priority — AI priority
- [ ] POST /api/tickets/check-duplicate — Duplicate check
- [ ] GET /api/tickets/:id/kb-suggestions — KB suggestions

## Comments (2 endpoints)
- [ ] GET /api/tickets/:id/comments — Get comments
- [ ] POST /api/tickets/:id/comments — Create comment

## Notifications (3 endpoints)
- [ ] GET /api/notifications — Get notifications
- [ ] PATCH /api/notifications/read-all — Mark all read
- [ ] PATCH /api/notifications/:id/read — Mark single read

## Categories (2 endpoints)
- [ ] GET /api/categories — Get all categories
- [ ] GET /api/categories/:id — Get single category

## Admin (3 endpoints)
- [ ] GET /api/admin/dashboard — Dashboard stats
- [ ] GET /api/admin/users — Get all users
- [ ] GET /api/admin/audit-logs — Get audit logs

## Knowledge Base (4 endpoints)
- [ ] GET /api/knowledge — Get all KB articles
- [ ] GET /api/knowledge/:id — Get single article
- [ ] POST /api/knowledge/search — Search KB
- [ ] POST /api/knowledge/apply — Apply KB solution

## Predictive (4 endpoints)
- [ ] GET /api/predictive/breach-risk — All breach risks
- [ ] GET /api/predictive/breach-risk/:id — Single breach risk
- [ ] GET /api/predictive/burnout — Agent burnout
- [ ] GET /api/predictive/forecast — Volume forecast

## Export (3 endpoints)
- [ ] GET /api/admin/export/csv — Export CSV
- [ ] GET /api/admin/export/json — Export JSON
- [ ] GET /api/admin/export/agent-report — Agent report

## Integration Tests
- [ ] Create ticket → Verify audit log created
- [ ] Assign ticket → Verify notification sent
- [ ] Change status → Verify SLA updated
- [ ] Add comment → Verify ticket updated
- [ ] Apply KB → Verify usage count incremented

## Error Scenarios
- [ ] Invalid token returns 401
- [ ] Missing required fields returns 400
- [ ] Non-existent ID returns 404
- [ ] Duplicate email returns 409
- [ ] Wrong password returns 401