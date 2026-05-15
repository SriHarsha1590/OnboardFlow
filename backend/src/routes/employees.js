const express = require('express');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { getTemporalClient } = require('../workers/temporalClient');
const {
  getManagerForRole,
  getITLead,
  getHRLead,
  createApprovalRequest,
  getPendingApprovalsForUser,
  getApprovalRequestsForEmployee,
  getApprovalStatus,
} = require('../utils/approvalService');

const router = express.Router();

const TASK_QUEUE = process.env.TEMPORAL_TASK_QUEUE || 'onboarding-queue';

// GET /api/employees - list all with workflow status
router.get('/', async (req, res) => {
  try {
    const { search, status, department } = req.query;

    let query = `
      SELECT e.*, w.workflow_id, w.run_id, w.status as workflow_status,
             w.current_step, w.current_step_index, w.started_at as workflow_started,
             w.completed_at as workflow_completed, w.id as workflow_db_id
      FROM employees e
      LEFT JOIN workflows w ON w.employee_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (e.name ILIKE $${params.length} OR e.email ILIKE $${params.length} OR e.department ILIKE $${params.length})`;
    }
    if (status) {
      params.push(status);
      query += ` AND w.status = $${params.length}`;
    }
    if (department) {
      params.push(department);
      query += ` AND e.department = $${params.length}`;
    }

    query += ' ORDER BY e.created_at DESC';

    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /employees error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/employees/stats
router.get('/stats', async (req, res) => {
  try {
    const statsQuery = `
      SELECT
        COUNT(DISTINCT e.id) as total,
        COUNT(DISTINCT CASE WHEN w.status = 'COMPLETED' THEN e.id END) as completed,
        COUNT(DISTINCT CASE WHEN w.status = 'RUNNING' THEN e.id END) as running,
        COUNT(DISTINCT CASE WHEN w.status = 'WAITING_SIGNAL' THEN e.id END) as waiting_approval,
        COUNT(DISTINCT CASE WHEN w.status = 'FAILED' THEN e.id END) as failed,
        COUNT(DISTINCT e.department) as departments
      FROM employees e
      LEFT JOIN workflows w ON w.employee_id = e.id
    `;
    const { rows } = await pool.query(statsQuery);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/employees/:id - single employee with full workflow details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const whereClause = isUuid ? 'e.id = $1' : 'e.employee_id = $1';
    
    const empQuery = `
      SELECT e.*, w.workflow_id, w.run_id, w.status as workflow_status,
             w.current_step, w.current_step_index, w.started_at as workflow_started,
             w.completed_at, w.id as workflow_db_id
      FROM employees e
      LEFT JOIN workflows w ON w.employee_id = e.id
      WHERE ${whereClause}
    `;
    const { rows: empRows } = await pool.query(empQuery, [id]);
    if (!empRows[0]) return res.status(404).json({ success: false, error: 'Employee not found' });

    const employee = empRows[0];
    const internalId = employee.id; // Always the UUID

    // Get activities using internal UUID
    const { rows: activities } = await pool.query(
      `SELECT wa.* FROM workflow_activities wa
       JOIN workflows w ON w.id = wa.workflow_id
       WHERE w.employee_id = $1 ORDER BY wa.activity_index`,
      [internalId]
    );

    // Get audit logs using internal UUID
    const { rows: logs } = await pool.query(
      `SELECT * FROM audit_logs WHERE employee_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [internalId]
    );

    // Get approval status using internal UUID
    const approvalStatus = await getApprovalStatus(internalId);

    res.json({
      success: true,
      data: { ...employee, activities, auditLogs: logs, approvalStatus },
    });
  } catch (err) {
    console.error(`GET /employees/${req.params.id} error:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/employees - create employee and request manager approval
router.post('/', authenticate, async (req, res) => {
  const client = await pool.connect();
  let employee = null;
  let workflow = null;
  let workflowId = null;
  let manager = null;
  let transactionCommitted = false;
  let workflowStarted = false;
  try {
    const { name, email, department, role, joiningDate, laptopModel, officeLocation } = req.body;
    const userId = req.user?.id; // Get logged in user ID

    if (!name || !email || !department || !role || !joiningDate) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    manager = await getManagerForRole(role, department);
    if (!manager) {
      return res.status(400).json({
        success: false,
        error: `No manager found for role: ${role}`,
      });
    }

    await client.query('BEGIN');

    // Insert employee
    const empResult = await client.query(
      `INSERT INTO employees (name, email, department, role, manager, joining_date, laptop_model, office_location, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, email, department, role, manager.name, joiningDate, laptopModel, officeLocation, userId]
    );
    employee = empResult.rows[0];

    // Create workflow record
    workflowId = `wf-emp-${employee.id.split('-')[0]}`;
    const wfResult = await client.query(
      `INSERT INTO workflows (employee_id, workflow_id, status, current_step, current_step_index)
       VALUES ($1, $2, 'WAITING_SIGNAL', 'waitForManagerApproval', 1) RETURNING *`,
      [employee.id, workflowId]
    );
    workflow = wfResult.rows[0];

    // Insert initial activities
    const activityDefs = [
      { name: 'initializeOnboarding', label: 'Initialize Onboarding' },
      { name: 'waitForManagerApproval', label: 'Manager Approval' },
      { name: 'createEmailAccount', label: 'Email & Credentials' },
      { name: 'waitForITApproval', label: 'IT Approval' },
      { name: 'provisionLaptop', label: 'Provision Laptop' },
      { name: 'waitForHRApproval', label: 'HR Approval' },
      { name: 'createAccessRights', label: 'Create Access Rights' },
      { name: 'notifyPayroll', label: 'Notify Payroll' },
      { name: 'sendWelcomeEmail', label: 'Send Welcome Email' },
    ];

    for (let i = 0; i < activityDefs.length; i++) {
      const status = i === 0 ? 'COMPLETED' : i === 1 ? 'WAITING_SIGNAL' : 'PENDING';
      await client.query(
        `INSERT INTO workflow_activities (workflow_id, activity_name, activity_index, status)
         VALUES ($1, $2, $3, $4)`,
        [workflow.id, activityDefs[i].name, i, status]
      );
    }

    // Create approval request for manager
    await createApprovalRequest(
      employee.id,
      workflow.id,
      'MANAGER_APPROVAL',
      manager.email,
      manager.name,
      client
    );

    await client.query('COMMIT');
    transactionCommitted = true;

    // Start Temporal workflow
    const temporalClient = await getTemporalClient();
    const handle = await temporalClient.workflow.start('employeeOnboardingWorkflow', {
      taskQueue: TASK_QUEUE,
      workflowId,
      args: [{
        employeeId: employee.id,
        workflowDbId: workflowId,
        name,
        personalEmail: email,
        department,
        role,
        manager: manager.name,
        managerEmail: manager.email,
        laptop: laptopModel,
        office: officeLocation,
        joiningDate,
      }],
    });
    workflowStarted = true;

    // Update run_id
    await pool.query('UPDATE workflows SET run_id = $1 WHERE workflow_id = $2', [handle.firstExecutionRunId, workflowId]);

    await pool.query(
      `INSERT INTO audit_logs (employee_id, action, actor, details) VALUES ($1, 'EMPLOYEE_CREATED', 'hr-system', $2)`,
      [employee.id, JSON.stringify({ workflowId, personalEmail: email, manager: manager.name, approvalSentTo: manager.email })]
    );

    res.status(201).json({
      success: true,
      data: {
        employee,
        workflowId,
        runId: handle.firstExecutionRunId,
        approvalSentTo: {
          type: 'MANAGER',
          name: manager.name,
          email: manager.email,
        },
      },
    });
  } catch (err) {
    if (!transactionCommitted) {
      await client.query('ROLLBACK').catch(() => {});
    } else if (!workflowStarted && employee?.id) {
      await pool.query('DELETE FROM employees WHERE id = $1', [employee.id]).catch((cleanupErr) => {
        console.error('Failed to clean up employee after workflow start failure:', cleanupErr);
      });
    }
    console.error('POST /employees error:', err);
    if (err.code === '23505') return res.status(409).json({ success: false, error: 'Email already exists' });
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// POST /api/employees/:id/approve-manager - manager approves employee
router.post('/:id/approve-manager', async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, approverEmail, reason } = req.body;

    // Get the employee and workflow
    const { rows: empRows } = await pool.query(
      `SELECT e.*, w.workflow_id, w.id as workflow_db_id FROM employees e
       LEFT JOIN workflows w ON e.id = w.employee_id
       WHERE e.id = $1`,
      [id]
    );

    if (!empRows[0]) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const employee = empRows[0];

    // Update the manager approval request
    const { rows: approvalRows } = await pool.query(
      `UPDATE approval_requests
       SET status = $1, reason = $2, responded_at = NOW()
       WHERE employee_id = $3 AND approval_type = 'MANAGER_APPROVAL' AND status = 'PENDING'
       RETURNING *`,
      [approved ? 'APPROVED' : 'REJECTED', reason || null, id]
    );

    if (!approvalRows[0]) {
      return res.status(400).json({ success: false, error: 'No pending manager approval found' });
    }

    const temporalClient = await getTemporalClient();
    const handle = temporalClient.workflow.getHandle(employee.workflow_id);

    await handle.signal('manager_approval', {
      approved,
      approvedBy: approverEmail || 'Manager',
      reason: reason || (approved ? 'Approved' : 'Rejected'),
    });

    if (approved) {
      try {
        const itLead = await getITLead();
        if (itLead) {
          await createApprovalRequest(
            id,
            employee.workflow_db_id,
            'IT_APPROVAL',
            itLead.email,
            itLead.name
          );
        }
      } catch (approvalErr) {
        console.error('Failed to create IT approval request after manager approval:', approvalErr);
      }
    }

    await pool.query(
      `INSERT INTO audit_logs (employee_id, action, actor, details) VALUES ($1, $2, $3, $4)`,
      [id, approved ? 'MANAGER_APPROVED' : 'MANAGER_REJECTED', approverEmail || 'Manager', JSON.stringify({ reason })]
    );

    res.json({
      success: true,
      data: {
        approved,
        employee: employee.name,
        nextStep: approved ? 'Generating work email, then awaiting IT approval for laptop provisioning' : 'Workflow terminated',
      },
    });
  } catch (err) {
    console.error('POST /approve-manager error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/employees/:id/approve-it - IT team approves laptop provisioning
router.post('/:id/approve-it', async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, approverEmail, reason } = req.body;

    // Get the employee and workflow
    const { rows: empRows } = await pool.query(
      `SELECT e.*, w.workflow_id, w.id as workflow_db_id FROM employees e
       LEFT JOIN workflows w ON e.id = w.employee_id
       WHERE e.id = $1`,
      [id]
    );

    if (!empRows[0]) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const employee = empRows[0];

    // Update the IT approval request
    const { rows: approvalRows } = await pool.query(
      `UPDATE approval_requests
       SET status = $1, reason = $2, responded_at = NOW()
       WHERE employee_id = $3 AND approval_type = 'IT_APPROVAL' AND status = 'PENDING'
       RETURNING *`,
      [approved ? 'APPROVED' : 'REJECTED', reason || null, id]
    );

    if (!approvalRows[0]) {
      return res.status(400).json({ success: false, error: 'No pending IT approval found' });
    }

    const temporalClient = await getTemporalClient();
    const handle = temporalClient.workflow.getHandle(employee.workflow_id);

    await handle.signal('it_approval', {
      approved,
      approvedBy: approverEmail || 'IT Team',
      reason: reason || (approved ? 'Approved' : 'Rejected'),
    });

    if (approved) {
      try {
        const hrLead = await getHRLead();
        if (hrLead) {
          await createApprovalRequest(
            id,
            employee.workflow_db_id,
            'HR_APPROVAL',
            hrLead.email,
            hrLead.name
          );
        }
      } catch (approvalErr) {
        console.error('Failed to create HR approval request after IT approval:', approvalErr);
      }
    }

    await pool.query(
      `INSERT INTO audit_logs (employee_id, action, actor, details) VALUES ($1, $2, $3, $4)`,
      [id, approved ? 'IT_APPROVED' : 'IT_REJECTED', approverEmail || 'IT Team', JSON.stringify({ reason })]
    );

    res.json({
      success: true,
      data: {
        approved,
        employee: employee.name,
        nextStep: approved ? 'Laptop approved and provisioned. Awaiting HR approval for access and payroll' : 'Workflow terminated',
      },
    });
  } catch (err) {
    console.error('POST /approve-it error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/employees/:id/approve-hr - HR approves access rights and payroll
router.post('/:id/approve-hr', async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, approverEmail, reason } = req.body;

    const { rows: empRows } = await pool.query(
      `SELECT e.*, w.workflow_id, w.id as workflow_db_id FROM employees e
       LEFT JOIN workflows w ON e.id = w.employee_id
       WHERE e.id = $1`,
      [id]
    );

    if (!empRows[0]) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const employee = empRows[0];

    const { rows: approvalRows } = await pool.query(
      `UPDATE approval_requests
       SET status = $1, reason = $2, responded_at = NOW()
       WHERE employee_id = $3 AND approval_type = 'HR_APPROVAL' AND status = 'PENDING'
       RETURNING *`,
      [approved ? 'APPROVED' : 'REJECTED', reason || null, id]
    );

    if (!approvalRows[0]) {
      return res.status(400).json({ success: false, error: 'No pending HR approval found' });
    }

    const temporalClient = await getTemporalClient();
    const handle = temporalClient.workflow.getHandle(employee.workflow_id);

    await handle.signal('hr_approval', {
      approved,
      approvedBy: approverEmail || 'HR Team',
      reason: reason || (approved ? 'Approved' : 'Rejected'),
    });

    await pool.query(
      `INSERT INTO audit_logs (employee_id, action, actor, details) VALUES ($1, $2, $3, $4)`,
      [id, approved ? 'HR_APPROVED' : 'HR_REJECTED', approverEmail || 'HR Team', JSON.stringify({ reason })]
    );

    res.json({
      success: true,
      data: {
        approved,
        employee: employee.name,
        nextStep: approved ? 'Proceeding with access rights, payroll, and welcome email' : 'Workflow terminated',
      },
    });
  } catch (err) {
    console.error('POST /approve-hr error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/employees/approvals/pending - get pending approvals for a user
router.get('/approvals/pending/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const approvals = await getPendingApprovalsForUser(email);
    res.json({ success: true, data: approvals });
  } catch (err) {
    console.error('GET /approvals/pending error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/employees/:id/approvals - get all approvals for an employee
router.get('/:id/approvals', async (req, res) => {
  try {
    const { id } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let internalId = id;

    if (!isUuid) {
      const { rows } = await pool.query('SELECT id FROM employees WHERE employee_id = $1', [id]);
      if (!rows[0]) return res.status(404).json({ success: false, error: 'Employee not found' });
      internalId = rows[0].id;
    }

    const approvals = await getApprovalRequestsForEmployee(internalId);
    res.json({ success: true, data: approvals });
  } catch (err) {
    console.error('GET /:id/approvals error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/employees/:id/activities
router.get('/:id/activities', async (req, res) => {
  try {
    const { id } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const whereClause = isUuid ? 'e.id = $1' : 'e.employee_id = $1';

    const { rows } = await pool.query(
      `SELECT wa.* FROM workflow_activities wa
       JOIN workflows w ON w.id = wa.workflow_id
       JOIN employees e ON e.id = w.employee_id
       WHERE ${whereClause} ORDER BY wa.activity_index`,
      [id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/employees/:id/logs
router.get('/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const whereClause = isUuid ? 'e.id = $1' : 'e.employee_id = $1';

    const { rows } = await pool.query(
      `SELECT al.* FROM audit_logs al
       JOIN employees e ON e.id = al.employee_id
       WHERE ${whereClause} ORDER BY al.created_at DESC`,
      [id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/employees/:id ──────────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if employee exists
    const existing = await pool.query('SELECT name FROM employees WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const employeeName = existing.rows[0].name;

    // Delete employee (Cascade handles workflows, activities, approvals, audit logs)
    await pool.query('DELETE FROM employees WHERE id = $1', [id]);

    console.log(`🗑️ Employee deleted: ${employeeName} (${id})`);

    res.json({
      success: true,
      message: `Employee ${employeeName} and all associated data have been removed.`,
    });
  } catch (err) {
    console.error('Delete employee error:', err);
    res.status(500).json({ error: 'Failed to delete employee. Please try again.' });
  }
});

module.exports = router;
