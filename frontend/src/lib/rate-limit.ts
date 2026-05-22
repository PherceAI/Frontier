import { NextRequest } from 'next/server';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  maxKeys?: number;
}

export function createRateLimiter(config: RateLimitConfig) {
  const { maxRequests, windowMs, maxKeys = 1000 } = config;
  const cache = new Map<string, number[]>();

  return async function rateLimiter(key: string): Promise<boolean> {
    // Bypass rate limit in testing environment
    if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true' || process.env.VITEST) {
      return true; // Allowed
    }

    const now = Date.now();
    const windowStart = now - windowMs;

    // Get and update timestamps for this key
    let timestamps = cache.get(key) || [];
    timestamps = timestamps.filter((ts) => ts > windowStart);
    timestamps.push(now);

    // LRU mechanism: delete and re-insert to update insertion order
    if (cache.has(key)) {
      cache.delete(key);
    }
    cache.set(key, timestamps);

    // LRU eviction if over max keys
    if (cache.size > maxKeys) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey !== undefined) {
        cache.delete(oldestKey);
      }
    }

    // Check limit
    if (timestamps.length > maxRequests) {
      return false; // Rate limit exceeded
    }

    return true; // Allowed
  };
}

export function getIpAddress(req: NextRequest): string {
  // Try to get the IP from the standard req.ip (casting to avoid TS error)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ip = (req as any).ip;
  if (ip) {
    return ip;
  }

  // Fallback to x-forwarded-for header
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // Ultimate fallback
  return 'unknown-ip';
}
