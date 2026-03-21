'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { loggingMiddleware, RedisCacheService, NullCacheService } = require('@ecom/shared');

const { connect } = require('./data/db');
const { seedDatabase } = require('./services/DatabaseSeederService');
const ProductService = require('./services/ProductService');
const CategoryService = require('./services/CategoryService');
const createProductRouter = require('./controllers/ProductController');
const createCategoryRouter = require('./controllers/CategoryController');

const app = express();
const PORT = process.env.PORT || 5004;

// --- Cache setup ---
const redisEnabled = process.env.REDIS_ENABLED === 'true';
const cacheService = redisEnabled
  ? new RedisCacheService({
    connectionString: process.env.REDIS_CONNECTION_STRING || 'localhost:6379',
    expirationMinutes: parseInt(process.env.REDIS_EXPIRATION_MINUTES || '30', 10),
    useTls: false,
  })
  : new NullCacheService();

// --- Service instances (inject cache) ---
const productService = new ProductService(cacheService);
const categoryService = new CategoryService(cacheService);

// --- Middleware ---
app.use(loggingMiddleware);
app.use(cors());
app.use(express.json());

// --- Routes ---
app.use('/api/products', createProductRouter(productService));
app.use('/api/categories', createCategoryRouter(categoryService, productService));

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'ProductService is healthy' });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, _req, res, _next) => {
  console.error('[ProductService] Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

connect()
  .then(async () => {
    await seedDatabase();
    app.listen(PORT, () => {
      console.log(`[ProductService] Listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('[ProductService] Failed to start:', err);
    process.exit(1);
  });

module.exports = app;
