# 🎉 OnboardFlow — Implementation Complete

## Changes Summary

This document outlines all the changes made to implement the enhanced approval workflow system with role-based manager assignment and IT team approvals.

---

## 🗄️ Database Changes

### New Tables
1. **`managers` table updated**
   - Added `role` column for role-specific manager assignment
   - Added `manager_type` column (`DEPARTMENT_HEAD`, `ROLE_HEAD`)
   - Managers now seeded with both role and department associations

2. **`it_team` table (NEW)**
   - Stores IT team members
   - Tracks IT lead and support staff
   - Used for laptop provisioning approvals

3. **`approval_requests` table (NEW)**
   - Tracks all approval requests (manager, IT, payroll, etc.)
   - Stores approval status, approver, reason, timestamps
   - Enables approval history and audit trail

### New Indexes
- `idx_approval_requests_status` - Fast lookup of pending approvals
- `idx_approval_requests_approver` - Find approvals by approver email
- `idx_approval_requests_employee` - Find approvals by employee

---

## 🔄 Backend API Changes

### New Files
- `backend/src/utils/approvalService.js` - Approval management utilities
- `backend/src/routes/it-team.js` - IT team endpoints

### Updated Routes

#### `POST /api/employees`
**Changes:**
- No longer accepts `manager` from frontend
- Auto-detects manager based on role via `getManagerForRole()`
- Creates approval request for manager
- Response includes `approvalSentTo` details

**Example Response:**
```json
{
  "success": true,
  "data": {
    "employee": {...},
    "workflowId": "wf-emp-xyz",
    "approvalSentTo": {
      "type": "MANAGER",
      "name": "Priya Kapoor",
      "email": "priya.kapoor@company.com"
    }
  }
}
```

#### `POST /api/employees/:id/approve-manager` (NEW)
**Purpose:** Manager approves employee onboarding
- Validates manager approval request
- On approval: Creates IT approval request, signals workflow
- On rejection: Terminates workflow
- Records approval in audit logs

#### `POST /api/employees/:id/approve-it` (NEW)
**Purpose:** IT team approves laptop provisioning
- Validates IT approval request
- On approval: Continues workflow to email creation
- On rejection: Terminates workflow
- Records approval in audit logs

#### `GET /api/employees/approvals/pending/:email` (NEW)
**Purpose:** Get all pending approvals for a user
- Returns manager/IT approvals awaiting their action
- Shows full employee context

#### `GET /api/employees/:id/approvals` (NEW)
**Purpose:** Get all approvals for an employee
- Returns complete approval history
- Shows status of each approval step

#### `GET /api/employees/:id` (UPDATED)
- Now includes `approvalStatus` object with:
  - `managerApproval` - Status, approver, reason, timestamp
  - `itApproval` - Status, approver, reason, timestamp
  - `payrollApproval` - Future extension

### Manager Endpoints (Updated)

#### `GET /api/managers`
- Optional `role` query parameter for filtering
- Returns managers and department heads

#### `GET /api/managers/role/:role` (NEW)
- Get role-specific manager head
- Fallback to department head if not found

#### `GET /api/managers/department/:department` (NEW)
- Get department head manager

### IT Team Endpoints (NEW)

#### `GET /api/it-team`
- List all IT team members

#### `GET /api/it-team/lead`
- Get IT lead (for notifications)

#### `GET /api/it-team/:id`
- Get specific IT team member

---

## 🎨 Frontend Changes

### API Client Updates (`api/client.js`)

**New Methods:**
```javascript
employeeApi.approveManager(id, payload)
employeeApi.approveIT(id, payload)
employeeApi.getPendingApprovals(email)

managerApi.getByRole(role)
managerApi.getByDepartment(dept)

itTeamApi.list()
itTeamApi.getLead()
itTeamApi.get(id)
```

### Page Updates

#### `NewEmployee.jsx` (MAJOR CHANGES)
- **Removed:** Reporting Manager dropdown (auto-assigned now)
- **Added:** Auto-fetch and display manager for selected role
- **Added:** Show manager approval target in sidebar
- **Added:** Loading spinner while fetching manager
- **Updated:** Workflow steps show manager AND IT approvals
- **Better UX:** Real-time manager selection feedback

#### `Approvals.jsx` (COMPLETE REDESIGN)
- **NEW:** Tab-based interface (All, Manager, IT)
- **NEW:** Separate cards for manager vs IT approvals
- **NEW:** Color-coded approval types (amber for manager, purple for IT)
- **NEW:** Shows next steps in approval flow
- **Updated:** Handles both approve and reject for each type
- **Better UX:** Clear visual separation of approval types

#### `EmployeeDetail.jsx` (UPDATED)
- **Added:** Shows manager approval status and response
- **Added:** Shows IT approval status and response
- **Added:** Context-aware approval buttons (manager/IT)
- **Added:** Displays approval reason and approver name
- **Updated:** Progress bar now reflects 7 steps (was 6)
- **Better UX:** Clear indication of which approval is pending

#### `Workflows.jsx` (MINOR)
- Updated progress calculation for 7 steps (was 6)

---

## 🔧 Workflow Changes

### Workflow Steps (Updated Count: 8 steps)

**Previous (7 steps):**
1. Initialize Onboarding
2. Wait for Manager Approval
3. Create Email Account
4. Provision Laptop
5. Create Access Rights
6. Notify Payroll
7. Send Welcome Email

**New (8 steps):**
1. Initialize Onboarding
2. Wait for Manager Approval ⭐
3. Wait for IT Approval ⭐ (NEW)
4. Create Email Account
5. Provision Laptop
6. Create Access Rights
7. Notify Payroll
8. Send Welcome Email

### Signal Handling (Updated)

**New signals in workflow:**
- `manager_approval` - Sent by manager approval endpoint
- `it_approval` - Sent by IT approval endpoint

---

## 📋 Configuration

### `.env.example` (NEW)
Added comprehensive environment variable reference:
```
DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
TEMPORAL_ADDRESS, TEMPORAL_NAMESPACE, TEMPORAL_TASK_QUEUE
PORT, FRONTEND_URL, NODE_ENV
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD (optional)
```

---

## 🛠️ Utility Functions

### `approvalService.js` (NEW)

**Functions:**
- `getManagerForRole(role, department)` - Auto-detect manager
- `getITLead()` - Get IT lead for laptop approvals
- `createApprovalRequest(...)` - Log approval request
- `getPendingApprovalsForUser(email)` - Get pending approvals
- `respondToApprovalRequest(...)` - Process approval response
- `getApprovalRequestsForEmployee(id)` - Get approval history
- `getApprovalStatus(id)` - Get complete approval status

---

## 📊 Workflow Changes

### Manager Assignment Logic
```
When employee with role "Senior Software Engineer" is created:
1. Check managers table for role-specific head
2. If found: Use that manager (role_type = 'ROLE_HEAD')
3. If not found: Fall back to department head
4. If still not found: Return error to user
```

### Approval Flow Diagram
```
New Employee Created
        ↓
[Step 1] → Manager Approval Request
        ↓
  Manager Reviews
  └─→ Approved: Continue
  └─→ Rejected: Terminate
        ↓
[Step 2] → IT Approval Request
        ↓
  IT Reviews Laptop
  └─→ Approved: Continue
  └─→ Rejected: Terminate
        ↓
[Step 3+] → Auto Activities (Email, Laptop, Access, Payroll, Welcome)
        ↓
Complete
```

---

## 🚀 How to Deploy

### 1. Update Database
```bash
cd backend
node src/db/migrate.js
```

### 2. Create `.env` File
```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Restart Services
```bash
# Terminal 1: API
cd backend && node src/index.js

# Terminal 2: Worker
cd backend && node src/workers/onboardingWorker.js

# Terminal 3: Frontend
cd frontend && npm run dev
```

---

## 🔍 Testing the Flow

### Test Manager Approval
1. Go to "New Employee" page
2. Select Engineering department and "Senior Software Engineer" role
3. Verify "Priya Kapoor" shows as manager
4. Submit form
5. Go to Approvals dashboard
6. Click "Approve" for manager
7. Verify IT approval request appears

### Test IT Approval
1. After manager approval, IT approval card appears
2. Click "Approve" for IT
3. Verify workflow continues to email creation
4. Check employee detail page for approval history

### Test Rejection
1. At any approval step, click "Reject"
2. Verify workflow status changes to "FAILED"
3. Check audit logs for rejection reason

---

## 📈 Benefits

✅ **Role-Based Assignment** - Managers auto-assigned by role, not manual selection
✅ **Separation of Concerns** - Manager ≠ IT approval
✅ **Audit Trail** - Complete approval history stored
✅ **Scalability** - Easy to add more approval steps
✅ **User Experience** - Clear workflow visibility
✅ **Data Integrity** - Approvals recorded before workflow continues

---

## 🔄 Migration Notes

### For Existing Installations
- Run `node src/db/migrate.js` to create new tables
- Existing employee records will continue to work
- Manager assignments auto-calculated based on role
- No data loss - all existing workflows preserved

### Backward Compatibility
- Old workflow records remain unchanged
- New approval workflow only applies to new employees
- Existing manager data preserved

---

## 📝 Next Steps (Optional Enhancements)

1. **Payroll Approval** - Add payroll team approval step
2. **Email Notifications** - Send approval requests via email
3. **Approval Deadlines** - Auto-escalate if no response in 24h
4. **Bulk Approvals** - Managers approve multiple employees
5. **Custom Workflows** - Different workflows by department
6. **Approval Analytics** - Dashboard for approval metrics

---

Generated: April 20, 2026
