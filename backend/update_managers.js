const pool = require('./src/db/pool');

async function updateManagerEmails() {
  try {
    const email = 'sriharshanandiraju@gmail.com';
    const result = await pool.query("UPDATE managers SET email = $1", [email]);
    console.log(`✅ Success! Updated ${result.rowCount} managers to use ${email}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating managers:', err.message);
    process.exit(1);
  }
}

updateManagerEmails();
