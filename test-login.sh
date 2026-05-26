Test 1: Using Postman
Method: POST
URL: http://localhost:5000/api/auth/register
Body: Select "raw" → "JSON"
Content:
json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}


Test 2: Using Postman
Method: POST
URL: http://localhost:5000/api/auth/login
Body: Select "raw" → "JSON"
Content:
json
{
  "email": "john@example.com",
  "password": "password123"
}

Login token : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTE1N2JmMjk0YmEzN2NiNWJiNDNkNDgiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc3OTc5MzY2NCwiZXhwIjoxNzgwMzk4NDY0fQ.5OwNSZaNJynet2dzLBQQVmoXc-DFPGSDwnze8tyt8rY


Test 3 — Get All Tickets
GET http://localhost:5000/api/tickets
Headers:
Authorization: Bearer <YOUR_JWT_TOKEN>
Expected: 200 OK with array of tickets

Test 2 — Get All Tickets
GET http://localhost:5000/api/tickets
Headers:
Authorization: Bearer <YOUR_JWT_TOKEN>
Expected: 200 OK with array of tickets

Test 3 — Get Single Ticket
GET http://localhost:5000/api/tickets/6a15823cdedd14a555b4b682
(Use _id from create response)
Headers:
Authorization: Bearer <YOUR_JWT_TOKEN>
Expected: 200 OK with single ticket

Test 4 — Change Status
PATCH http://localhost:5000/api/tickets/6a15823cdedd14a555b4b682/status
Headers:
Content-Type: application/json
Authorization: Bearer <YOUR_JWT_TOKEN>
Body:
json{
  "status": "in_progress"
}
Expected: 200 OK ticket with updated status

Test 5 — Suggest Priority
POST http://localhost:5000/api/tickets/suggest-priority
(No auth needed)
Body:
json{
  "description": "System is down and not working at all, this is critical emergency"
}
Expected: 200 OK
json{
  "suggestedPriority": "critical",
  "confidence": 100
}

Test 6 — Check Duplicate
POST http://localhost:5000/api/tickets/check-duplicate
Body:
json{
  "description": "My laptop crashed and won't turn on"
}
Expected: 200 OK
json{
  "hasDuplicate": true,
  "similarTickets": [...]
}

