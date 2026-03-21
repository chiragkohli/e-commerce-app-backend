'use strict';

/**
 * Generic authentication middleware (Base64 token decoder).
 * Mirrors the AuthenticationMiddleware present in CartService and OrderService.
 *
 * Token format:  base64( userId + ":" + unixTimestamp + ":" + uuid )
 * Decoded:       parts[0] = userId
 *
 * Attach userId to req.userId.
 * Returns 401 when the Authorization header is missing or token is malformed.
 *
 * @param {string[]} [skipPaths]  Path prefixes that bypass auth (e.g. ['/health'])
 */
function createAuthMiddleware(skipPaths = []) {
  return function authMiddleware(req, res, next) {
    const path = req.path || '';

    // Skip auth for paths that start with any of the skip prefixes
    const skip = skipPaths.some(prefix => path.startsWith(prefix));
    if (skip) return next();

    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }

    const token = authHeader.slice(7).trim();
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf8');
      const parts = decoded.split(':');
      if (parts.length < 3 || !parts[0]) {
        return res.status(401).json({ success: false, message: 'Invalid token format' });
      }
      req.userId = parts[0];
      return next();
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
  };
}

module.exports = createAuthMiddleware;
