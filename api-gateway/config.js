'use strict';

/**
 * API Gateway Configuration
 * Defines routing rules, service URLs, and health check endpoints
 */

const gatewayConfig = {
  // Gateway port
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Service routing configuration
  services: [
    {
      name: 'user-service',
      url: process.env.USER_SERVICE_URL || 'http://localhost:5001',
      healthEndpoint: '/health',
      routes: ['/api/auth'],
      timeout: 5000,
      retries: 2,
    },
    {
      name: 'product-service',
      url: process.env.PRODUCT_SERVICE_URL || 'http://localhost:5002',
      healthEndpoint: '/health',
      routes: ['/api/products', '/api/categories'],
      timeout: 5000,
      retries: 2,
    },
    {
      name: 'search-service',
      url: process.env.SEARCH_SERVICE_URL || 'http://localhost:5003',
      healthEndpoint: '/health',
      routes: ['/api/search'],
      timeout: 5000,
      retries: 2,
    },
  ],

  // Circuit breaker settings
  circuitBreaker: {
    failureThreshold: 5, // Number of failures before opening circuit
    resetTimeout: 30000, // 30 seconds before attempting recovery
    monitorInterval: 5000, // Check health every 5 seconds
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    requestLogging: true,
  },
};

module.exports = gatewayConfig;
