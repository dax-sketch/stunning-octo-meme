import { Request, Response, NextFunction } from 'express';

// Simple in-memory cache for development
// In production, you'd want to use Redis or similar
class MemoryCache {
  private cache = new Map<string, { data: any; expiry: number }>();

  set(key: string, data: any, ttlSeconds: number): void {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data, expiry });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

const cache = new MemoryCache();

// Clean up expired entries every 5 minutes
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000);

// Cache middleware factory
export const cacheMiddleware = (ttlSeconds: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create cache key from URL and query parameters
    const cacheKey = `${req.originalUrl}:${JSON.stringify(req.query)}:${req.user?.userId || 'anonymous'}`;

    // Try to get from cache
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // Store original json method
    const originalJson = res.json;

    // Override json method to cache the response
    res.json = function(data: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, data, ttlSeconds);
      }
      
      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

// Cache invalidation helpers
export const invalidateCache = {
  // Invalidate all company-related cache
  companies: () => {
    const keysToDelete: string[] = [];
    for (const [key] of (cache as any).cache.entries()) {
      if (key.includes('/api/companies') || key.includes('/api/dashboard')) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => cache.delete(key));
  },

  // Invalidate user-specific cache
  user: (userId: string) => {
    const keysToDelete: string[] = [];
    for (const [key] of (cache as any).cache.entries()) {
      if (key.includes(userId)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => cache.delete(key));
  },

  // Invalidate all cache
  all: () => {
    cache.clear();
  }
};

// Middleware to add cache headers
export const cacheHeaders = (maxAge: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET') {
      res.set({
        'Cache-Control': `public, max-age=${maxAge}`,
        'ETag': `"${Date.now()}"`,
      });
    }
    next();
  };
};