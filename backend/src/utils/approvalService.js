const pool = require('../db/pool');
const {
  buildManagerProfile,
  findRoleDefinition,
  getDepartmentHeadRole,
  normalizeDepartment,
  normalizeRole,
} = require('../data/orgHierarchy');

/**
 * Get the appropriate manager for a given role
 */
async function getManagerForRole(role, department) {
  try {
    const roleDefinition = findRoleDefinition(role, department);
    if (!roleDefinition?.reportsTo) {
      return null;
    }

    const normalizedDepartment = normalizeDepartment(
      roleDefinition.managerDepartment || roleDefinition.department || department
    );
    const managerRole = normalizeRole(roleDefinition.reportsTo);

    const exactMatch = await pool.query(
      `SELECT * FROM managers
       WHERE role = $1 AND department = $2
       LIMIT 1`,
      [managerRole, normalizedDepartment]
    );

    if (exactMatch.rows.length > 0) {
      return exactMatch.rows[0];
    }

    const crossDepartmentMatch = await pool.query(
      `SELECT * FROM managers
       WHERE role = $1
       ORDER BY name
       LIMIT 1`,
      [managerRole]
    );

    if (crossDepartmentMatch.rows.length > 0) {
      return crossDepartmentMatch.rows[0];
    }

    const departmentHeadRole = getDepartmentHeadRole(normalizedDepartment);
    if (departmentHeadRole) {
      const departmentHead = await pool.query(
        `SELECT * FROM managers
         WHERE role = $1 AND department = $2
         LIMIT 1`,
        [departmentHeadRole, normalizedDepartment]
      );
      if (departmentHead.rows.length > 0) {
        return departmentHead.rows[0];
      }
    }

    return buildManagerProfile(managerRole, normalizedDepartment);
  } catch (err) {
    console.error('Error getting manager for role:', err.message);
    throw err;
  }
}

/**
 * Get IT team lead
 */
async function getITLead() {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM it_team WHERE role = 'IT_LEAD' LIMIT 1`
    );
    return rows[0] || null;
  } catch (err) {
    console.error('Error getting IT lead:', err.message);
    throw err;
  }
}

async function getHRLead() {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM managers
       WHERE department = 'HR / Recruitment / L&D' AND role IN ('HR Director', 'HR Manager', 'L&D Manager')
       ORDER BY CASE role
         WHEN 'HR Director' THEN 1
         WHEN 'HR Manager' THEN 2
         WHEN 'L&D Manager' THEN 3
         ELSE 4
       END
       LIMIT 1`
    );

    if (rows[0]) return rows[0];

    return buildManagerProfile('HR Director', 'HR / Recruitment / L&D');
  } catch (err) {
    console.error('Error getting HR lead:', err.message);
    throw err;
  }
}

/**
 * Create an approval request
 */
async function createApprovalRequest(employeeId, workflowId, approvalType, approverEmail, approverName, db = pool) {
  try {
    const { rows } = await db.query(
      `INSERT INTO approval_requests 
       (employee_id, workflow_id, approval_type, approver_email, approver_name, status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING')
       RETURNING *`,
      [employeeId, workflowId, approvalType, approverEmail, approverName]
    );
    return rows[0];
  } catch (err) {
    console.error('Error creating approval request:', err.message);
    throw err;
  }
}

/**
 * Get pending approval requests for a given approver
 */
async function getPendingApprovalsForUser(approverEmail) {
  try {
    const { rows } = await pool.query(
      `SELECT ar.*, e.name as employee_name, e.email as employee_email, 
              e.department, e.role, w.workflow_id
       FROM approval_requests ar
       JOIN employees e ON e.id = ar.employee_id
       LEFT JOIN workflows w ON w.id = ar.workflow_id
       WHERE ar.approver_email = $1 AND ar.status = 'PENDING'
       ORDER BY ar.requested_at DESC`,
      [approverEmail]
    );
    return rows;
  } catch (err) {
    console.error('Error getting pending approvals:', err.message);
    throw err;
  }
}

/**
 * Respond to an approval request
 */
async function respondToApprovalRequest(requestId, approved, reason) {
  try {
    const { rows } = await pool.query(
      `UPDATE approval_requests 
       SET status = $1, reason = $2, responded_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [approved ? 'APPROVED' : 'REJECTED', reason || null, requestId]
    );
    return rows[0];
  } catch (err) {
    console.error('Error responding to approval request:', err.message);
    throw err;
  }
}

/**
 * Get all approval requests for an employee
 */
async function getApprovalRequestsForEmployee(employeeId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM approval_requests 
       WHERE employee_id = $1
       ORDER BY requested_at DESC`,
      [employeeId]
    );
    return rows;
  } catch (err) {
    console.error('Error getting approval requests for employee:', err.message);
    throw err;
  }
}

/**
 * Get approval status for employee workflow
 */
async function getApprovalStatus(employeeId) {
  try {
    const { rows } = await pool.query(
      `SELECT approval_type, status, approver_name, reason, responded_at
       FROM approval_requests
       WHERE employee_id = $1
       ORDER BY requested_at DESC`,
      [employeeId]
    );
    
    return {
      managerApproval: rows.find(r => r.approval_type === 'MANAGER_APPROVAL') || null,
      itApproval: rows.find(r => r.approval_type === 'IT_APPROVAL') || null,
      hrApproval: rows.find(r => r.approval_type === 'HR_APPROVAL') || null,
      payrollApproval: rows.find(r => r.approval_type === 'PAYROLL_APPROVAL') || null,
      allApprovals: rows,
    };
  } catch (err) {
    console.error('Error getting approval status:', err.message);
    throw err;
  }
}

module.exports = {
  getManagerForRole,
  getITLead,
  getHRLead,
  createApprovalRequest,
  getPendingApprovalsForUser,
  respondToApprovalRequest,
  getApprovalRequestsForEmployee,
  getApprovalStatus,
};
