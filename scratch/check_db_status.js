const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function checkStatus() {
  try {
    console.log('--- Workflows ---');
    const wf = await pool.query('SELECT * FROM workflows ORDER BY started_at DESC LIMIT 5');
    console.table(wf.rows);

    console.log('\n--- Approval Requests ---');
    const ar = await pool.query('SELECT * FROM approval_requests ORDER BY requested_at DESC LIMIT 5');
    console.table(ar.rows);

    console.log('\n--- Employees ---');
    const emp = await pool.query('SELECT id, name, email, manager, employee_id FROM employees ORDER BY created_at DESC LIMIT 5');
    console.table(emp.rows);

    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkStatus();
