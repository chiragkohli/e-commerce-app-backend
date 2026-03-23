'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const axios = require('axios');
const config = require('./config');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// ─── Service Health Tracker ────────────────────────────────────────
const serviceHealth = {};
config.services.forEach(service => {
  serviceHealth[service.name] = {
    healthy: false,
    failures: 0,
    lastChecked: null,
    circuitOpen: false,
  };
});

/**
 * Check health of all services periodically
 */
async function checkServiceHealth() {
  for (const service of config.services) {
    try {
      const url = `${service.url}${service.healthEndpoint}`;
      const response = await axios.get(url, { timeout: 3000 });

      if (response.status === 200) {
        serviceHealth[service.name].healthy = true;
        serviceHealth[service.name].failures = 0;
        serviceHealth[service.name].lastChecked = new Date();

        // Reset circuit if service recovers
        if (serviceHealth[service.name].circuitOpen) {
          console.log(`[Gateway] ${service.name} recovered - closing circuit`);
          serviceHealth[service.name].circuitOpen = false;
        }
      }
    } catch (err) {
      serviceHealth[service.name].healthy = false;
      serviceHealth[service.name].failures++;
      serviceHealth[service.name].lastChecked = new Date();

      // Open circuit if too many failures
      if (serviceHealth[service.name].failures >= config.circuitBreaker.failureThreshold) {
        serviceHealth[service.name].circuitOpen = true;
        console.error(`[Gateway] Circuit opened for ${service.name} after ${serviceHealth[service.name].failures} failures`);
      } else {
        console.warn(`[Gateway] Health check failed for ${service.name} (${serviceHealth[service.name].failures}/${config.circuitBreaker.failureThreshold})`);
      }
    }
  }
}

// Start health checks
setInterval(checkServiceHealth, config.circuitBreaker.monitorInterval);
checkServiceHealth(); // Initial check

// ─── Routing ──────────────────────────────────────────────────────

/**
 * Find service for a given path
 */
function findServiceForPath(path) {
  return config.services.find(service =>
    service.routes.some(route => path.startsWith(route))
  );
}

/**
 * Make request to service with retry logic
 */
async function proxyRequest(service, req, res, attempt = 1) {
  try {
    // Check circuit breaker
    if (serviceHealth[service.name].circuitOpen) {
      return res.status(503).json({
        success: false,
        message: `${service.name} is currently unavailable (circuit open)`,
      });
    }

    if (!serviceHealth[service.name].healthy) {
      return res.status(503).json({
        success: false,
        message: `${service.name} is currently unavailable`,
      });
    }

    const targetUrl = `${service.url}${req.originalUrl.replace(/^\/api/, '/api')}`;

    const axiosConfig = {
      method: req.method,
      url: targetUrl,
      headers: {
        ...req.headers,
        host: new URL(service.url).host,
      },
      timeout: service.timeout,
      validateStatus: () => true, // Don't throw on any status code
    };

    // Include body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      axiosConfig.data = req.body;
    }

    const response = await axios(axiosConfig);

    // Log successful request
    console.log(`[Gateway] ${req.method} ${req.originalUrl} → ${service.name} (${response.status})`);

    // Forward response from service
    res.status(response.status).json(response.data);
  } catch (err) {
    // Increment failure count
    serviceHealth[service.name].failures++;

    console.error(
      `[Gateway] Request failed for ${service.name} (attempt ${attempt}/${service.retries + 1}):`,
      err.message
    );

    // Retry logic
    if (attempt < service.retries + 1) {
      console.log(`[Gateway] Retrying ${service.name}... (attempt ${attempt + 1}/${service.retries + 1})`);
      return proxyRequest(service, req, res, attempt + 1);
    }

    // All retries exhausted
    return res.status(503).json({
      success: false,
      message: `Failed to connect to ${service.name}`,
      error: err.message,
    });
  }
}

// ─── Gateway Status Endpoint (MUST be before catch-all) ───────────

app.get('/gateway/status', (req, res) => {
  const status = {
    gateway: 'running',
    timestamp: new Date(),
    services: {},
  };

  config.services.forEach(service => {
    const health = serviceHealth[service.name];
    status.services[service.name] = {
      url: service.url,
      healthy: health.healthy,
      circuitOpen: health.circuitOpen,
      failures: health.failures,
      lastChecked: health.lastChecked,
    };
  });

  res.json(status);
});

// ─── Gateway Root Endpoint ─────────────────────────────────────────

app.get('/', (req, res) => {
  return res.json({
    success: true,
    message: 'API Gateway is running',
    version: '1.0.0',
    services: config.services.map(s => ({
      name: s.name,
      healthy: serviceHealth[s.name].healthy,
      routes: s.routes,
    })),
  });
});

/**
 * Main request handler (MUST be last - catch-all)
 */
app.all('*', async (req, res) => {
  const service = findServiceForPath(req.path);

  if (!service) {
    return res.status(404).json({
      success: false,
      message: 'Route not found',
      availableRoutes: config.services.flatMap(s => s.routes),
    });
  }

  return proxyRequest(service, req, res);
});

// ─── Error Handler ────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  console.error('[Gateway] Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Gateway error',
    error: err.message,
  });
});

// ─── Start Server ─────────────────────────────────────────────────

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`[API Gateway] Listening on port ${PORT}`);
  console.log(`[API Gateway] Environment: ${config.nodeEnv}`);
  console.log(
    `[API Gateway] Routes:\n${config.services
      .map(s => `  ${s.name}: ${s.routes.join(', ')}`)
      .join('\n')}`
  );
});

module.exports = app;
