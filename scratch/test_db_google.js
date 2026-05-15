const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'onboardflow',
  password: 'postgres',
  port: 5433,
});

async function testGoogleAuth() {
  const credential = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFhMmIyYzNkNGU1ZjZnN2g4aTljMGExYjJjM2Q0ZTVmNmc3aDhpcCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYmYiOjE3MTU3Mzg1MDYsImF1ZCI6IjI4NzA3MDMzMDM5Mi1za3Y0cm41a2h1MXBucHNlbTZ1MWI4M2pqNHN2dTkzNi5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjExMjIzMzQ0NTU2Njc3ODg5OTAwMSIsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXpwIjoiMjg3MDcwMzMwMzkyLXNrdjRybjVraHUxcG5wc2VtNnUxYjgzamo0c3Z1OTM2LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwibmFtZSI6IlRlc3QgVXNlciIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJMTIzNDU2Nzg5MGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6PXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IlRlc3QiLCJmYW1pbHlfbmFtZSI6IlVzZXIiLCJpYXQiOjE3MTU3Mzg4MDYsImV4cCI6MTcxNTc0MjQwNiwianRpIjoiMWEyYjJjM2Q0ZTVmNmc3aDhpOWMwYTFiMmMyZDRlNWY2ZzdoOGlwIn0.signature";
  const parts = credential.split('.');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  const { sub: googleId, email, name, picture } = payload;

  try {
    let user;
    const existing = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR google_id = $2',
      [email.toLowerCase(), googleId]
    );

    if (existing.rows.length > 0) {
      user = existing.rows[0];
      console.log('Existing user found:', user);
      if (!user.google_id || !user.avatar_url) {
        const updated = await pool.query(
          `UPDATE users SET google_id = COALESCE(google_id, $1), avatar_url = COALESCE(avatar_url, $2),
           auth_provider = CASE WHEN auth_provider = 'email' AND google_id IS NULL THEN 'google' ELSE auth_provider END
           WHERE id = $3 RETURNING *`,
          [googleId, picture, user.id]
        );
        user = updated.rows[0];
        console.log('Updated user:', user);
      }
    } else {
      console.log('Inserting new user:', name, email, googleId, picture);
      const result = await pool.query(
        `INSERT INTO users (full_name, email, google_id, avatar_url, auth_provider)
         VALUES ($1, $2, $3, $4, 'google')
         RETURNING *`,
        [name || 'Google User', email.toLowerCase(), googleId, picture]
      );
      user = result.rows[0];
      console.log('Created user:', user);
    }
  } catch (err) {
    console.error('DB Error:', err);
  } finally {
    pool.end();
  }
}

testGoogleAuth();
