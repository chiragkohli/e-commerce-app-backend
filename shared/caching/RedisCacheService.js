'use strict';

const Redis = require('ioredis');

/**
 * Redis-backed cache service.
 * Mirrors Shared.Core.Caching.Services.RedisCacheService
 */
class RedisCacheService {
  /**
   * @param {object} settings
   * @param {string}  settings.connectionString  e.g. "localhost:6379" or "host:port,password=xxx"
   * @param {string}  [settings.accessKey]
   * @param {boolean} [settings.useTls]
   * @param {number}  [settings.expirationMinutes]
   * @param {number}  [settings.connectTimeoutMs]
   * @param {number}  [settings.responseTimeoutMs]
   */
  constructor(settings) {
    this._defaultTtl = (settings.expirationMinutes || 30) * 60; // seconds

    const [host, portStr] = settings.connectionString.split(':');
    const port = parseInt(portStr || '6379', 10);

    const opts = {
      host,
      port,
      connectTimeout: settings.connectTimeoutMs || 5000,
      commandTimeout: settings.responseTimeoutMs || 5000,
      lazyConnect: false,
      enableOfflineQueue: false,
      retryStrategy: (times) => times >= 3 ? null : Math.min(times * 100, 1000),
    };

    if (settings.accessKey) {
      opts.password = settings.accessKey;
    }
    if (settings.useTls) {
      opts.tls = { rejectUnauthorized: false };
    }

    this._client = new Redis(opts);
    this._client.on('error', (err) => {
      // Suppress console noise — services fall back to live queries on cache miss
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[Redis] connection error:', err.message);
      }
    });
  }

  async getAsync(key) {
    try {
      const raw = await this._client.get(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async setAsync(key, value, ttlSeconds) {
    try {
      const serialized = JSON.stringify(value);
      const ttl = ttlSeconds ?? this._defaultTtl;
      if (ttl > 0) {
        await this._client.set(key, serialized, 'EX', ttl);
      } else {
        await this._client.set(key, serialized);
      }
    } catch {
      // ignore cache write failures
    }
  }

  async removeAsync(key) {
    try {
      await this._client.del(key);
    } catch {
      // ignore
    }
  }

  async existsAsync(key) {
    try {
      const result = await this._client.exists(key);
      return result === 1;
    } catch {
      return false;
    }
  }
}

module.exports = RedisCacheService;
