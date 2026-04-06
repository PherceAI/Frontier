import { NextRequest } from 'next/server';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  maxCacheSize?: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class LRURateLimiter {
  private cache: Map<string, RateLimitEntry>;
  private maxRequests: number;
  private windowMs: number;
  private maxCacheSize: number;

  constructor(config: RateLimitConfig) {
    this.cache = new Map();
    this.maxRequests = config.maxRequests;
    this.windowMs = config.windowMs;
    this.maxCacheSize = config.maxCacheSize || 10000;
  }

  public check(ip: string): boolean {
    // Skip rate limiting in test environments
    if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
      return true;
    }

    const now = Date.now();
    const entry = this.cache.get(ip);

    if (entry) {
      // Re-insert to maintain LRU order
      this.cache.delete(ip);

      if (now > entry.resetTime) {
        // Window expired, reset count
        this.cache.set(ip, { count: 1, resetTime: now + this.windowMs });
        return true;
      } else {
        if (entry.count >= this.maxRequests) {
          // Put it back to keep it in cache
          this.cache.set(ip, entry);
          return false;
        } else {
          entry.count += 1;
          this.cache.set(ip, entry);
          return true;
        }
      }
    }

    // New entry
    if (this.cache.size >= this.maxCacheSize) {
      // Evict least recently used (first item in Map)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(ip, { count: 1, resetTime: now + this.windowMs });
    return true;
  }
}

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ip = (request as any).ip;
  if (ip) {
    return ip;
  }

  return 'unknown';
}

export const loginRateLimiter = new LRURateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
  maxCacheSize: 5000,
});
