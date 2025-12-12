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

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMinutes?: number
  ): Promise<T> {
    const cached = this.get<T>(key);

    if (cached !== null) {
      return Promise.resolve(cached);
    }

    return fetchFn().then((data) => {
      this.set(key, data, ttlMinutes);
      return data;
    });
  }

  async getOrFetchWithStale<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMinutes?: number
  ): Promise<{ data: T; isStale: boolean }> {
    const cached = this.get<T>(key);

    if (cached !== null) {
      // Return cached data immediately and refresh in background
      fetchFn()
        .then((freshData) => {
          this.set(key, freshData, ttlMinutes);
        })
        .catch((error) => {
          console.error('Background refresh failed:', error);
        });

      return { data: cached, isStale: true };
    }

    const freshData = await fetchFn();
    this.set(key, freshData, ttlMinutes);
    return { data: freshData, isStale: false };
  }

  getCacheInfo(): {
    totalKeys: number;
    totalSize: number;
    keys: string[];
  } {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(this.prefix));
    const totalSize = keys.reduce((sum, key) => {
      const item = localStorage.getItem(key);
      return sum + (item?.length || 0);
    }, 0);

    return {
      totalKeys: keys.length,
      totalSize,
      keys: keys.map((k) => k.replace(this.prefix, '')),
    };
  }
}

export const cache = new CacheService();
