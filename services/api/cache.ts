import { getConfig } from '../config';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export class CacheService {
  private prefix = 'dashboard_cache_';

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  get<T>(key: string): T | null {
    try {
      const cacheKey = this.getKey(key);
      const item = localStorage.getItem(cacheKey);

      if (!item) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(item);
      const now = Date.now();

      // Check if cache has expired
      if (now - entry.timestamp > entry.ttl) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  set<T>(key: string, data: T, ttlMinutes?: number): void {
    try {
      const config = getConfig();
      const ttl = (ttlMinutes || config.cache.ttlMinutes) * 60 * 1000; // Convert to milliseconds

      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };

      const cacheKey = this.getKey(key);
      localStorage.setItem(cacheKey, JSON.stringify(entry));
    } catch (error) {
      console.error('Cache set error:', error);
      // If localStorage is full or disabled, fail silently
    }
  }

  clear(key?: string): void {
    try {
      if (key) {
        const cacheKey = this.getKey(key);
        localStorage.removeItem(cacheKey);
      } else {
        // Clear all cache entries
        const keys = Object.keys(localStorage);
        for (const k of keys) {
          if (k.startsWith(this.prefix)) {
            localStorage.removeItem(k);
          }
        }
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
}

export const cache = new CacheService();
