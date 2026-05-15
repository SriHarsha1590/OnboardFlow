const credential = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFhMmIyYzNkNGU1ZjZnN2g4aTljMGExYjJjM2Q0ZTVmNmc3aDhpcCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYmYiOjE3MTU3Mzg1MDYsImF1ZCI6IjI4NzA3MDMzMDM5Mi1za3Y0cm41a2h1MXBucHNlbTZ1MWI4M2pqNHN2dTkzNi5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjExMjIzMzQ0NTU2Njc3ODg5OTAwMSIsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXpwIjoiMjg3MDcwMzMwMzkyLXNrdjRybjVraHUxcG5wc2VtNnUxYjgzamo0c3Z1OTM2LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwibmFtZSI6IlRlc3QgVXNlciIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJMTIzNDU2Nzg5MGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6PXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IlRlc3QiLCJmYW1pbHlfbmFtZSI6IlVzZXIiLCJpYXQiOjE3MTU3Mzg4MDYsImV4cCI6MTcxNTc0MjQwNiwianRpIjoiMWEyYjJjM2Q0ZTVmNmc3aDhpOWMwYTFiMmMyZDRlNWY2ZzdoOGlwIn0.signature";

try {
  const parts = credential.split('.');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  console.log("Success:", payload);
} catch (e) {
  console.log("Error with base64url:", e);
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    console.log("Success with base64:", payload);
  } catch (e2) {
    console.log("Error with base64:", e2);
  }
}
