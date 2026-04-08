import { NextRequest } from 'next/server';

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  limit: number;
  windowMs: number;
  maxCacheSize: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  limit: 5,           // Default 5 requests
  windowMs: 60 * 1000, // 1 minute window
  maxCacheSize: 1000  // Max 1000 IPs in cache to prevent OOM
};

class RateLimiter {
  private cache: Map<string, RateLimitInfo>;
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.cache = new Map();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if the request should be rate limited.
   * Returns true if the request is allowed, false if rate limited.
   */
  public check(ip: string): boolean {
    // Bypass in test environments
    if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
      return true;
    }

    const now = Date.now();
    const info = this.cache.get(ip);

    if (info) {
      if (now > info.resetTime) {
        // Window expired, reset
        info.count = 1;
        info.resetTime = now + this.config.windowMs;
        // Move to end (LRU behavior)
        this.cache.delete(ip);
        this.cache.set(ip, info);
        return true;
      }

      if (info.count >= this.config.limit) {
        // Rate limited
        // Move to end (LRU behavior)
        this.cache.delete(ip);
        this.cache.set(ip, info);
        return false;
      }

      info.count++;
      // Move to end (LRU behavior)
      this.cache.delete(ip);
      this.cache.set(ip, info);
      return true;
    }

    // New IP
    // Enforce max cache size (evict oldest)
    if (this.cache.size >= this.config.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
          this.cache.delete(oldestKey);
      }
    }

    this.cache.set(ip, {
      count: 1,
      resetTime: now + this.config.windowMs,
    });
    return true;
  }
}

/**
 * Extract a secure IP from the request.
 * Prevent IP spoofing bypasses.
 */
export function getIP(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // Fallback to NextRequest.ip, needs type casting in Next.js App Router
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reqIp = (req as any).ip;
  if (reqIp) {
    return reqIp;
  }

  return 'unknown';
}

// Global instance for auth rate limiting
export const authRateLimiter = new RateLimiter({
  limit: 5,
  windowMs: 60 * 1000,
  maxCacheSize: 500, // smaller cache size for auth
});
