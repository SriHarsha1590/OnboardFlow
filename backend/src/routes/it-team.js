const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// GET /api/it-team - get all IT team members
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM it_team ORDER BY name');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/it-team/lead - get IT lead
router.get('/lead', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM it_team WHERE role = \'IT_LEAD\' LIMIT 1');
    res.json({ success: true, data: rows[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/it-team/:id - get specific IT team member
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM it_team WHERE id = $1', [id]);
    res.json({ success: true, data: rows[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
