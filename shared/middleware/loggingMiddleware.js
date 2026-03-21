'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * Request / response logging middleware.
 * Mirrors Shared.Core.Logging.LoggingMiddleware
 */
function loggingMiddleware(req, res, next) {
  const correlationId = uuidv4().slice(0, 8).toUpperCase();
  const start = Date.now();

  // Attach correlation ID so controllers can reference it if needed
  req.correlationId = correlationId;

  console.log(`[${correlationId}] Incoming request: ${req.method} ${req.originalUrl}`);

  // Capture response body length / status after response finishes
  const originalEnd = res.end.bind(res);
  res.end = function (...args) {
    const duration = Date.now() - start;
    console.log(
      `[${correlationId}] Response: ${res.statusCode} (${duration}ms)`
    );
    return originalEnd(...args);
  };

  next();
}

module.exports = loggingMiddleware;
