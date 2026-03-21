'use strict';

const { v4: uuidv4 } = require('uuid');
const { getMockUsers } = require('../data/MockUserData');
const { ApiResponse } = require('@ecom/shared/utils/ApiResponse');

// In-memory invalidated token store (resets on restart – mirrors .NET HashSet)
const invalidatedTokens = new Set();

class AuthService {
  /**
   * @param {object} body
   * @param {string} body.email
   * @param {string} body.password
   */
  async loginAsync({ email, password }) {
    if (!email || !password) {
      return ApiResponse.error('Email and password are required');
    }

    const users = getMockUsers();
    const user = users.find(
      u => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user || user.password !== password) {
      return { ...ApiResponse.error('Invalid email or password'), statusCode: 401 };
    }

    // Generate token: base64(userId:unixTimestamp:uuid)
    const raw = `${user.id}:${Date.now()}:${uuidv4()}`;
    const token = Buffer.from(raw).toString('base64');

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24h

    return ApiResponse.success(
      { userId: user.id, username: user.username, token, expiresAt },
      'Login successful'
    );
  }

  /**
   * @param {object} body
   * @param {string} body.token
   */
  async logoutAsync({ token }) {
    if (!token) {
      return { ...ApiResponse.error('Token is required'), statusCode: 400 };
    }
    invalidatedTokens.add(token);
    return ApiResponse.success(null, 'Logged out successfully');
  }

  /**
   * Check whether a token has been explicitly invalidated.
   * @param {string} token
   * @returns {boolean}
   */
  isTokenInvalidated(token) {
    return invalidatedTokens.has(token);
  }
}

module.exports = new AuthService();
