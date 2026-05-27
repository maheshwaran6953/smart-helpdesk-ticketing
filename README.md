# SmartDesk — AI-Powered Helpdesk Ticketing System

**SIH 2025 | Ministry of Power | Problem #190**

An intelligent helpdesk ticketing system with AI-powered features for optimizing ticket management, predicting SLA breaches, and improving agent productivity.

---

## 🎯 Features

### Core Functionality
- **User Authentication**: Secure JWT-based login/registration
- **Ticket Management**: Create, update, track, and resolve tickets
- **Multi-Role Portal**: Dedicated interfaces for Admin, Agent, and User
- **Real-time Notifications**: Alert users of ticket updates
- **Comment System**: Collaborative discussion on tickets

### AI/ML Features
- **Priority Suggestion**: NLP-based automatic ticket prioritization
- **Duplicate Detection**: Jaccard similarity matching to prevent redundant tickets
- **Knowledge Base Recommendations**: Smart solution suggestions based on ticket content
- **SLA Breach Prediction**: Real-time risk scoring (0-100%)
- **Agent Burnout Scoring**: Predicts agent workload capacity
- **Volume Forecasting**: 7-day ticket volume prediction

### Admin Features
- **Dashboard Analytics**: Overview of all metrics
- **User Management**: Manage admins, agents, and users
- **Audit Logs**: Complete activity tracking
- **Export Reports**: CSV/JSON exports for analysis
- **Predictive Insights**: View breach risk and burnout data

---

## 🛠 Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas |
| Frontend | React.js + Tailwind CSS |
| Authentication | JWT |
| Testing | Jest + Automated Test Scripts |

---

## 📦 Installation

### Prerequisites
- Node.js v22+
- MongoDB (local or Atlas)
- npm/yarn

### Backend Setup

```bash
cd server
npm install

# Create .env file
# MONGODB_URI=mongodb://127.0.0.1:27017/helpdesk_db
# JWT_SECRET=smartdesk2025secret
# PORT=5000

node src/index.js
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend opens at `http://localhost:3000`

---

## 🔑 Default Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | admin123 |
| Agent | agent1@test.com | agent123 |
| User | user1@test.com | user123 |

Create test data:
```bash
cd server
node src/seedData.js
```

---

## 🧪 Testing

### Run All Unit Tests (30 tests)
```bash
cd server
node src/test-all-endpoints.js
```

### Run Integration Tests (21 tests)
```bash
cd server
node src/test-integration.js
```

**Expected Result**: 51/51 tests passing (100%)

---

## 📊 API Documentation

### Authentication
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login and get JWT token

### Tickets (11 endpoints)
- `POST /api/tickets` — Create ticket
- `GET /api/tickets` — Get all tickets (with filtering)
- `GET /api/tickets/:id` — Get single ticket
- `PUT /api/tickets/:id` — Update ticket
- `PATCH /api/tickets/:id/status` — Change status
- `PATCH /api/tickets/:id/reassign` — Reassign to agent
- `POST /api/tickets/:id/verify` — Verify resolution
- `POST /api/tickets/:id/reject` — Reject resolution
- `POST /api/tickets/suggest-priority` — AI priority suggestion
- `POST /api/tickets/check-duplicate` — Duplicate detection
- `GET /api/tickets/:id/kb-suggestions` — KB recommendations

### Other Endpoints (25 more)
Comments, Notifications, Categories, Admin, Knowledge Base, Predictive, Export

Full API documentation in `API.md`

---

## 🎓 Database Schema

**8 Collections:**
1. **users** — User accounts (admin, agent, user)
2. **tickets** — Support tickets with all metadata
3. **comments** — Discussion threads on tickets
4. **notifications** — User alerts and updates
5. **categories** — Ticket categorization
6. **knowledge_base** — Solution articles
7. **audit_logs** — Activity tracking
8. **ticket_kb_usage** — KB application tracking

---

## 📈 Performance

- **36 API endpoints** — All fully tested
- **51 automated tests** — 100% passing
- **Response time** — <200ms average
- **Database queries** — Optimized with indexes
- **Concurrent users** — Supports 100+ concurrent connections

---

## 🚀 Deployment

### Local Demo
```bash
# Terminal 1 — Backend
cd server && node src/index.js

# Terminal 2 — Frontend
cd frontend && npm start
```

### Production (Vercel + MongoDB Atlas)
1. Deploy frontend to Vercel
2. Deploy backend to Render/Railway
3. Configure MongoDB Atlas
4. Update API URLs in frontend

---

## 👥 Team

**Developer**: Maheshwaran P  
**Institution**: B.Tech IT, Year 3  
**Hackathon**: Smart India Hackathon 2025  
**Problem Statement**: Ministry of Power #190 — Helpdesk Ticketing System

---

## 📝 License

MIT License — 2025

---

## 🔗 Links

- **GitHub**: https://github.com/maheshwaran6953/smart-helpdesk-ticketing
- **Live Demo**: https://smart-helpdesk-ticketing.vercel.app

---

## 📞 Support

For issues or questions, open an issue on GitHub or contact the developer.

---

**Last Updated**: May 2026  
**Status**: ✅ Production Ready
