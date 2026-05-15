const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function migrate() {
  try {
    console.log('Adding new columns to banking_details table...');
    await pool.query(`
      ALTER TABLE banking_details 
      ADD COLUMN IF NOT EXISTS uan_number CHARACTER VARYING,
      ADD COLUMN IF NOT EXISTS aadhar_number CHARACTER VARYING,
      ADD COLUMN IF NOT EXISTS alternate_contact CHARACTER VARYING,
      ADD COLUMN IF NOT EXISTS permanent_address TEXT
    `);
    console.log('Migration successful!');
    await pool.end();
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
