'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const loggingMiddleware = require('@ecom/shared/middleware/loggingMiddleware');
const createAuthMiddleware = require('@ecom/shared/middleware/authMiddleware');
const { connect } = require('./data/db');
const orderRouter = require('./controllers/OrderController');

const app = express();
const PORT = process.env.PORT || 5003;

const auth = createAuthMiddleware(['/health', '/api/orders/health']);

app.use(loggingMiddleware);
app.use(cors());
app.use(express.json());
app.use('/api/orders', auth, orderRouter);

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'OrderService is healthy' });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, _req, res, _next) => {
  console.error('[OrderService] Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[OrderService] Listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('[OrderService] Failed to connect to MongoDB:', err);
    process.exit(1);
  });

module.exports = app;
