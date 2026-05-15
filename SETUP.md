# 🚀 OnboardFlow Setup & Deployment

Complete guide to set up and run the enhanced OnboardFlow system with role-based manager approvals and IT team workflows.

---

## 📋 Prerequisites

- **Node.js 16+**
- **PostgreSQL 12+**
- **Temporal Server** (Docker recommended)
- **Docker & Docker Compose** (optional but recommended)

---

## 🐳 Quick Start with Docker

### 1. Start Services
```bash
docker-compose up -d
```

This starts:
- PostgreSQL database
- Temporal Server
- Both UI dashboards

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env if needed (defaults work with Docker Compose)
```

### 3. Run Database Migration
```bash
cd backend
node src/db/migrate.js
```

Expected output:
```
✅ All migrations completed successfully!

📊 Database schema created:
  ✓ employees
  ✓ workflows
  ✓ workflow_activities
  ✓ audit_logs
  ✓ managers (with role-based assignments)
  ✓ it_team
  ✓ approval_requests

🎉 Database ready!
```

### 4. Start Backend
```bash
cd backend
npm install  # if not done yet
node src/index.js
```

Expected output:
```
╔══════════════════════════════════════════╗
║     OnboardFlow Backend API Server       ║
╚══════════════════════════════════════════╝

✅ Connected to PostgreSQL
📊 Database healthy
🌐 API listening on http://localhost:3000

Endpoints:
  ✓ POST   /api/employees
  ✓ GET    /api/employees
  ✓ GET    /api/employees/:id
  ✓ POST   /api/employees/:id/approve-manager
  ✓ POST   /api/employees/:id/approve-it
  ✓ GET    /api/managers
  ✓ GET    /api/managers/role/:role
  ✓ GET    /api/managers/department/:dept
  ✓ GET    /api/it-team
```

### 5. Start Temporal Worker (New Terminal)
```bash
cd backend
node src/workers/onboardingWorker.js
```

Expected output:
```
╔══════════════════════════════════════════╗
║       OnboardFlow Temporal Worker        ║
╚══════════════════════════════════════════╝

✅ Worker connected to Temporal at localhost:7233
📋 Task Queue: onboarding-queue
🌐 Namespace: default

🔄 Polling for tasks...
```

### 6. Start Frontend (New Terminal)
```bash
cd frontend
npm install  # if not done yet
npm run dev
```

Expected output:
```
  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### 7. Open Dashboard
- **Frontend**: http://localhost:5173
- **Temporal UI**: http://localhost:8233
- **API**: http://localhost:3000

---

## 🔧 Manual Setup (Without Docker)

### 1. PostgreSQL Setup
```bash
# Create database
psql -U postgres -c "CREATE DATABASE onboardflow;"

# Or via Docker:
docker run --name postgres-onboard -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=onboardflow -p 5432:5432 -d postgres:15
```

### 2. Temporal Server Setup
```bash
# Option A: Docker
docker run --name temporal -p 7233:7233 -p 8233:8233 temporalio/auto-setup:latest

# Option B: Download from https://github.com/temporalio/temporal/releases
temporal server start-dev
```

### 3. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=onboardflow
DB_USER=postgres
DB_PASSWORD=postgres

# Temporal
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=onboarding-queue

# Server
PORT=3000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### 4. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 5. Run Migrations
```bash
cd backend
node src/db/migrate.js
```

### 6. Start Services (3 Terminals)
```bash
# Terminal 1: Backend API
cd backend
node src/index.js

# Terminal 2: Temporal Worker
cd backend
node src/workers/onboardingWorker.js

# Terminal 3: Frontend
cd frontend
npm run dev
```

---

## 🧪 Testing the Flow

### Test 1: Create Employee
1. Navigate to http://localhost:5173
2. Click "New Employee"
3. Fill form:
   - Name: "John Engineer"
   - Email: "john@company.com"
   - Department: "Engineering"
   - Role: "Senior Software Engineer"
   - Joining Date: Today + 1 month
   - Laptop: "MacBook Pro 16"
   - Office: "San Francisco"
4. Verify manager "Priya Kapoor" is auto-selected
5. Click "Submit"

**Expected Result:**
- Employee created in database
- Approval request sent to Priya Kapoor
- Workflow waiting on manager_approval signal
- Status shows "⏸ Awaiting Manager Approval"

### Test 2: Manager Approval
1. Navigate to "Approvals" page
2. See "John Engineer" in Manager Approvals tab
3. Click "Approve" button
4. Verify approval confirmed

**Expected Result:**
- Manager approval recorded in approval_requests table
- IT approval request created automatically
- Workflow progresses to Step 2

### Test 3: IT Approval
1. See "John Engineer" in IT Approvals tab
2. Click "Approve" button
3. Verify approval confirmed

**Expected Result:**
- IT approval recorded
- Workflow progresses to Step 3 (Create Email)
- Email account created, laptop provisioned, access configured
- Workflow completes

### Test 4: Check Employee Detail
1. Go to Employees page
2. Click on "John Engineer"
3. Verify:
   - Manager approval shows ✓ Approved
   - IT approval shows ✓ Approved
   - Progress bar at 100%
   - All workflow steps completed
   - Welcome email sent status shown

---

## 🔍 Debugging

### Check Database
```bash
psql -U postgres -d onboardflow

# List employees
SELECT id, name, email, department, role FROM employees;

# Check pending approvals
SELECT employee_id, approval_type, status, approver_email 
FROM approval_requests 
WHERE status = 'PENDING';

# Check workflows
SELECT workflow_id, current_step, current_step_index, status 
FROM workflows;
```

### Check Temporal
Visit http://localhost:8233:
- "Workflows" tab shows all workflow executions
- Click workflow to see timeline
- Check for signal sends and completions

### Backend Logs
Look for:
```
✅ Manager approval recorded
Creating IT approval request
🔄 Sending IT approval signal
✅ IT approval recorded
Workflow continuing to email creation
```

### Frontend Console
Open DevTools (F12) for API call logs

---

## 📊 Database Tables

### approval_requests
Stores all approval workflow records:
```sql
SELECT * FROM approval_requests 
WHERE employee_id = 'employee-uuid'
ORDER BY created_at DESC;
```

### managers
Role-based manager assignments:
```sql
SELECT name, email, role, manager_type 
FROM managers 
WHERE role IN ('Senior Software Engineer', 'Product Manager');
```

### it_team
IT team members for laptop provisioning:
```sql
SELECT name, email, role 
FROM it_team;
```

---

## 🛑 Stopping Services

### Docker
```bash
docker-compose down
```

### Manual
Press `Ctrl+C` in each terminal

---

## 🔐 Production Deployment

### Environment Variables (Required for Production)
```env
NODE_ENV=production
FRONTEND_URL=https://onboard.company.com
TEMPORAL_ADDRESS=temporal.company.com:7233
DB_HOST=db.company.com
DB_PORT=5432
DB_USER=onboard_user
DB_PASSWORD=<strong-password>
SMTP_HOST=smtp.company.com
SMTP_PORT=587
SMTP_USER=noreply@company.com
SMTP_PASSWORD=<email-password>
```

### Recommendations
1. Use PostgreSQL RDS or managed service
2. Use Temporal Cloud (https://cloud.temporal.io)
3. Deploy backend on AWS/GCP/Azure
4. Use CDN for frontend (CloudFront, Cloudflare)
5. Set up SSL/TLS certificates
6. Enable API rate limiting
7. Set up monitoring and alerting
8. Use environment-specific configs
9. Implement audit logging
10. Set up database backups

---

## 🆘 Troubleshooting

### Database Connection Failed
```bash
# Verify PostgreSQL running
psql -U postgres -c "SELECT 1"

# Check connection string in .env
# Verify DB_HOST, DB_PORT, DB_USER, DB_PASSWORD
```

### Temporal Connection Failed
```bash
# Verify Temporal running
curl http://localhost:8233/

# Check TEMPORAL_ADDRESS in .env
# Default: localhost:7233
```

### Frontend Not Loading
```bash
# Clear browser cache (Ctrl+Shift+Delete)
# Check http://localhost:5173 is accessible
# Check frontend console for errors
# Run: cd frontend && npm run dev
```

### Approval Not Working
1. Check database migration ran successfully
2. Verify managers table has role assignments
3. Check approval_requests table has record
4. Review backend logs for errors
5. Verify Temporal workflow execution in UI

### Email Not Sending
1. Configure SMTP settings in .env
2. Check SMTP credentials
3. Verify firewall allows outbound SMTP
4. Check backend logs for email errors

---

## 📚 Additional Resources

- [IMPLEMENTATION.md](IMPLEMENTATION.md) — Detailed changes summary
- [README.md](README.md) — Project overview
- [QUICKSTART.md](QUICKSTART.md) — Quick start guide
- [Temporal Docs](https://docs.temporal.io) — Temporal workflow framework
- [PostgreSQL Docs](https://www.postgresql.org/docs/) — Database documentation

---

**Last Updated:** April 2026
**Version:** 2.0 (Role-Based Approval System)
