/**
 * Database Migration Script
 * Adds new approval workflow tables and IT team support
 * Run: cd backend && node src/db/migrate.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./pool');
const { buildManagerSeedRows } = require('../data/orgHierarchy');

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║     OnboardFlow Database Migration       ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');

    // Read the schema file
    const schemaPath = path.join(__dirname, '../../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Execute the full schema as a single batch so comments don't break statement parsing.
    await client.query(schema);

    await client.query('TRUNCATE managers CASCADE');
    await client.query('TRUNCATE it_team CASCADE');

    const managerSeeds = buildManagerSeedRows();
    for (const manager of managerSeeds) {
      await client.query(
        `INSERT INTO managers (name, email, department, role, manager_type)
         VALUES ($1, $2, $3, $4, $5)`,
        [manager.name, manager.email, manager.department, manager.role, manager.manager_type]
      );
    }

    await client.query(
      `INSERT INTO it_team (name, email, role) VALUES ('IT Support', 'harsha.ti.app@gmail.com', 'IT_LEAD')`
    );

    console.log('✅ All migrations completed successfully!');
    console.log('');
    console.log('📊 Database schema created:');
    console.log('  ✓ users');
    console.log('  ✓ employees');
    console.log('  ✓ workflows');
    console.log('  ✓ workflow_activities');
    console.log('  ✓ audit_logs');
    console.log('  ✓ managers (with role-based assignments)');
    console.log('  ✓ it_team');
    console.log('  ✓ approval_requests');
    console.log('');
    console.log('🎉 Database ready!');
    console.log('');
  } catch (err) {
    console.error('');
    console.error('❌ Migration failed:', err.message);
    console.error('');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
