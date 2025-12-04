/**
 * Cache Service
 * In-memory caching for performance optimization
 */

export class CacheService {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0
    };
  }

  /**
   * Get cached value
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    console.log(`[Cache] HIT: ${key}`);
    return entry.value;
  }

  /**
   * Set cached value
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, value, ttl = 60000) {
    const entry = {
      value,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now()
    };
    
    this.cache.set(key, entry);
    console.log(`[Cache] SET: ${key} (TTL: ${ttl}ms)`);
  }

  /**
   * Delete cached value
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
    console.log(`[Cache] DELETE: ${key}`);
  }

  /**
   * Clear all cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`[Cache] CLEAR: Removed ${size} entries`);
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0;
    
    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: `${hitRate}%`
    };
  }

  /**
   * Clean expired entries
   */
  cleanExpired() {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    if (removed > 0) {
      console.log(`[Cache] Cleaned ${removed} expired entries`);
    }
    
    return removed;
  }
}

// Create singleton cache instance
export const cache = new CacheService();

// Clean expired entries every 5 minutes
setInterval(() => cache.cleanExpired(), 5 * 60 * 1000);

// Cache key generators
export const cacheKeys = {
  blockchainContext: () => 'blockchain:context',
  gasPrice: () => 'blockchain:gasPrice',
  blockNumber: () => 'blockchain:blockNumber',
  chatResponse: (question) => `chat:${question.toLowerCase().substring(0, 50)}`,
  balance: (address) => `balance:${address.toLowerCase()}`
};

