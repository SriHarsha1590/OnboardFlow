const express = require('express');
const pool = require('../db/pool');
const {
  ORG_STRUCTURE,
  findRoleDefinition,
  getDepartmentHeadRole,
  getRolesByDepartment,
  normalizeDepartment,
} = require('../data/orgHierarchy');
const { getManagerForRole } = require('../utils/approvalService');

const router = express.Router();

// GET /api/managers - get all managers, optionally filtered by role
router.get('/', async (req, res) => {
  try {
    const { role, department } = req.query;
    let query = 'SELECT * FROM managers';
    const params = [];

    if (role) {
      params.push(role);
      query += ` WHERE role = $${params.length}`;
    }

    if (department) {
      params.push(normalizeDepartment(department));
      query += params.length === 1 ? ` WHERE department = $${params.length}` : ` AND department = $${params.length}`;
    }

    query += ' ORDER BY name';
    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/org-structure', async (req, res) => {
  res.json({
    success: true,
    data: ORG_STRUCTURE.map((group) => ({
      department: group.department,
      roles: getRolesByDepartment(group.department),
      headRole: getDepartmentHeadRole(group.department),
    })),
  });
});

// GET /api/managers/role/:role - get manager head for specific role
router.get('/role/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const { department } = req.query;
    const manager = await getManagerForRole(role, department);
    const roleDefinition = findRoleDefinition(role, department);

    if (!manager) {
      res.json({
        success: true,
        data: null,
        message: roleDefinition?.reportsTo
          ? `No manager record found for ${roleDefinition.reportsTo}`
          : `No reporting manager configured for ${role}`,
      });
      return;
    }

    res.json({
      success: true,
      data: {
        ...manager,
        managerRole: roleDefinition?.reportsTo || null,
        employeeDepartment: roleDefinition?.department || normalizeDepartment(department),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/managers/department/:department - get manager for department
router.get('/department/:department', async (req, res) => {
  try {
    const { department } = req.params;
    const normalizedDepartment = normalizeDepartment(department);
    const headRole = getDepartmentHeadRole(normalizedDepartment);
    if (!headRole) {
      res.json({ success: true, data: null });
      return;
    }

    const { rows } = await pool.query(
      `SELECT * FROM managers WHERE department = $1 AND role = $2 LIMIT 1`,
      [normalizedDepartment, headRole]
    );
    res.json({ success: true, data: rows[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
