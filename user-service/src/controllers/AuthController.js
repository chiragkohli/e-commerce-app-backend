'use strict';

const { Router } = require('express');
const authService = require('../services/AuthService');

const router = Router();

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const result = await authService.loginAsync(req.body);
    const status = result.statusCode || (result.success ? 200 : 400);
    // Strip our internal statusCode before sending
    const { statusCode: _sc, ...body } = result;
    return res.status(status).json(body);
  } catch (err) {
    console.error('[AuthController] login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout
 * Body: { token }
 */
router.post('/logout', async (req, res) => {
  try {
    const result = await authService.logoutAsync(req.body);
    const status = result.statusCode || (result.success ? 200 : 400);
    const { statusCode: _sc, ...body } = result;
    return res.status(status).json(body);
  } catch (err) {
    console.error('[AuthController] logout error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
