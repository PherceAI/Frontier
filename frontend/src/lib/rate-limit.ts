export class LRURateLimiter {
  private cache = new Map<string, { count: number; resetAt: number }>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  limit(key: string, maxRequests: number, windowMs: number): boolean {
    if ((process.env.NODE_ENV === 'test' || process.env.VITEST) && !process.env.TEST_RATE_LIMITER) return true;

    const now = Date.now();
    const entry = this.cache.get(key);

    if (entry && now < entry.resetAt) {
      if (entry.count >= maxRequests) return false;
      entry.count++;
      this.cache.delete(key);
      this.cache.set(key, entry);
      return true;
    }

    if (!entry && this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }

    // Ensure order is updated even if entry exists but has expired
    this.cache.delete(key);
    this.cache.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
}

export const authRateLimiter = new LRURateLimiter(1000);

export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (req as any).ip || '127.0.0.1';
}
