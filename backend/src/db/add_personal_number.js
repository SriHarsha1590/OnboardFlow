require('dotenv').config();
const pool = require('./pool');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Adding personal_number column to banking_details...');
    await client.query(`
      ALTER TABLE banking_details 
      ADD COLUMN IF NOT EXISTS personal_number VARCHAR(20)
    `);
    console.log('✅ Column added successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
