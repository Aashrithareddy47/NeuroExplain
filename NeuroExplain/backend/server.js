const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { pool, testConnection } = require('./db');
const userRoutes = require('./routes/userRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// 1. Security & Core Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 2. Health & Status Check Endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    const [rows] = await pool.query('SELECT 1 as is_alive');
    if (rows && rows[0]?.is_alive === 1) {
      dbStatus = 'connected';
    }
  } catch (dbErr) {
    dbStatus = 'error: ' + dbErr.message;
  }

  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);

  return res.status(200).json({
    status: 'online',
    system: 'NeuroExplain Backend API',
    version: '1.0.0',
    uptime: Math.round(process.uptime()) + ' seconds',
    database: dbStatus,
    gemini: {
      configured: geminiConfigured,
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    },
    timestamp: new Date().toISOString()
  });
});

// 3. API Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', userRoutes); // Alias for flexible client consumption
app.use('/api/reports', reportRoutes);

// 4. Root Endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'NeuroExplain API is active.',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      reports: '/api/reports'
    },
    disclaimer: 'NeuroExplain is an educational patient-support tool and does not provide a medical diagnosis.'
  });
});

// 5. 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

// 6. Central Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Unhandled Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.'
  });
});

// 7. Start Server & Verify Database
async function startServer() {
  const isDbConnected = await testConnection();
  if (!isDbConnected) {
    console.warn('[Warning] MySQL connection could not be established immediately. The server will still listen and retry on requests.');
  }

  const server = app.listen(PORT, () => {
    console.log(`
=============================================================
  NEUROEXPLAIN BACKEND SERVER STARTED
  Port: ${PORT}
  URL:  http://localhost:${PORT}
  Environment: ${process.env.NODE_ENV || 'development'}
  Database: ${process.env.DB_NAME || 'neuroexplain'}
  Gemini AI Model: ${process.env.GEMINI_MODEL || 'gemini-2.5-flash'}
=============================================================
    `);
  });

  return server;
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, startServer };
