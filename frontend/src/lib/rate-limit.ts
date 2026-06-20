import { NextRequest } from 'next/server';

interface RateLimitInfo {
  count: number;
  resetAt: number;
}

// Simple LRU Cache for rate limiting
class LRURateLimit {
  private cache = new Map<string, RateLimitInfo>();
  private readonly maxSize: number;

  constructor(maxSize: number = 5000) {
    this.maxSize = maxSize;
  }

  check(ip: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    let info = this.cache.get(ip);

    if (!info || info.resetAt < now) {
      info = { count: 1, resetAt: now + windowMs };
    } else {
      info.count++;
    }

    this.cache.delete(ip); // Delete to re-insert at end (LRU behavior)
    this.cache.set(ip, info);

    if (this.cache.size > this.maxSize) {
      // LRU logic: remove the first item (oldest accessed)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    return info.count <= limit;
  }
}

const loginRateLimiter = new LRURateLimit(5000); // Max 5000 IPs tracked

export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const ip = (req as any).ip;
  if (ip) return ip;
  return 'unknown-ip';
}

export function isRateLimited(req: NextRequest): boolean {
  // Bypass in test environments
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    return false;
  }
  const ip = getClientIp(req);
  // 5 requests per 1 minute (60000 ms)
  return !loginRateLimiter.check(ip, 5, 60000);
}
