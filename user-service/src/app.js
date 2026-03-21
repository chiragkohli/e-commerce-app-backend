'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const loggingMiddleware = require('@ecom/shared/middleware/loggingMiddleware');
const authRouter = require('./controllers/AuthController');

const app = express();
const PORT = process.env.PORT || 5001;

// --- Middleware ---
app.use(loggingMiddleware);
app.use(cors());
app.use(express.json());

// --- Routes ---
app.use('/api/auth', authRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'UserService is healthy' });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('[UserService] Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`[UserService] Listening on port ${PORT}`);
});

module.exports = app;
