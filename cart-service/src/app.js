'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const loggingMiddleware = require('@ecom/shared/middleware/loggingMiddleware');
const createAuthMiddleware = require('@ecom/shared/middleware/authMiddleware');
const { connect } = require('./data/db');
const cartRouter = require('./controllers/CartController');

const app = express();
const PORT = process.env.PORT || 5002;

// Auth middleware skips /health paths
const auth = createAuthMiddleware(['/health', '/api/cart/health']);

// --- Middleware ---
app.use(loggingMiddleware);
app.use(cors());
app.use(express.json());
app.use('/api/cart', auth, cartRouter);

// Root health check
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'CartService is healthy' });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('[CartService] Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[CartService] Listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('[CartService] Failed to connect to MongoDB:', err);
    process.exit(1);
  });

module.exports = app;
