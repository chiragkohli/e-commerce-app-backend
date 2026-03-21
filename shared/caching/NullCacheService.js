'use strict';

/**
 * Null Object cache service – no-ops for all methods.
 * Used when Redis is disabled or unavailable.
 */
class NullCacheService {
  async getAsync(_key) { return null; }
  async setAsync(_key, _val, _ttl) { }
  async removeAsync(_key) { }
  async existsAsync(_key) { return false; }
}

module.exports = NullCacheService;
