import { LRUCache } from 'lru-cache';

// Options: Max 500 items, items live for 1 hour by default
const options = {
  max: 500, 
  ttl: 1000 * 60 * 60, 
  allowStale: false,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
};

const cache = new LRUCache(options);

export default {
  /**
   * Get item from cache
   * @param {string} key 
   */
  async get(key) {
    return cache.get(key);
  },

  /**
   * Set item in cache
   * @param {string} key 
   * @param {any} value 
   * @param {number} ttl - Time to live in seconds (optional)
   */
  async set(key, value, ttl = null) {
    const options = ttl ? { ttl: ttl * 1000 } : undefined;
    cache.set(key, value, options);
  },

  /**
   * Delete item from cache
   * @param {string} key 
   */
  async del(key) {
    cache.delete(key);
  },

  /**
   * Clear entire cache
   */
  async clear() {
    cache.clear();
  }
};