require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

process.on('uncaughtException', (err) => {
  console.error('🔥 UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 UNHANDLED REJECTION:', reason);
});

const authRoutes     = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const managerRoutes  = require('./routes/managers');
const itTeamRoutes  = require('./routes/it-team');
const chatbotRoutes = require('./routes/chatbot');
const onboardingPortalRoutes = require('./routes/onboarding-portal');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174'].filter(Boolean),
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/managers',  managerRoutes);
app.use('/api/it-team',   itTeamRoutes);
app.use('/api/chatbot',  chatbotRoutes);
app.use('/api/onboarding-portal', onboardingPortalRoutes);

// Serve BGV template as downloadable file
app.get('/api/downloads/bgv-template', (req, res) => {
  const filePath = require('path').join(__dirname, 'data', 'Employee_BGV_Form_Empty.docx');
  res.download(filePath, 'Employee_BGV_Form_Empty.docx');
});

// Serve Onboarding PPT as downloadable file
app.get('/api/downloads/onboarding-ppt', (req, res) => {
  const filePath = require('path').join(__dirname, 'data', 'Technoidentity_Onboarding.pptx');
  res.download(filePath, 'Technoidentity_Onboarding.pptx');
});

// Health check
app.get('/api/health', async (req, res) => {
  const pool = require('./db/pool');
  let dbStatus = 'disconnected';
  try { await pool.query('SELECT 1'); dbStatus = 'connected'; } catch {}

  res.json({
    status: 'ok',
    service: 'OnboardFlow API',
    version: '1.0.0',
    node: process.version,
    db: dbStatus,
    temporal: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()) + 's',
  });
});

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║        OnboardFlow  —  API Server        ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`  ✅  http://localhost:${PORT}`);
  console.log(`  🩺  http://localhost:${PORT}/api/health`);
  console.log(`  🗄️   ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  console.log(`  ⚡  Temporal → ${process.env.TEMPORAL_ADDRESS}`);
  console.log('');
});

module.exports = app;
