export interface RateLimitOptions {
    limit: number;
    windowMs: number;
    maxEntries?: number;
}

interface RateLimitInfo {
    count: number;
    resetTime: number;
}

export class RateLimiter {
    private cache: Map<string, RateLimitInfo>;
    private limit: number;
    private windowMs: number;
    private maxEntries: number;

    constructor(options: RateLimitOptions) {
        this.cache = new Map();
        this.limit = options.limit;
        this.windowMs = options.windowMs;
        this.maxEntries = options.maxEntries || 10000;
    }

    public check(ip: string): { success: boolean; limit: number; remaining: number; reset: number } {
        // Bypass for testing environments
        if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
            return { success: true, limit: this.limit, remaining: this.limit, reset: Date.now() + this.windowMs };
        }

        const now = Date.now();
        let info = this.cache.get(ip);

        // If not found or expired, reset
        if (!info || now > info.resetTime) {
            info = { count: 0, resetTime: now + this.windowMs };
        }

        info.count++;

        // Delete and re-set to move it to the end of the Map (LRU eviction strategy)
        this.cache.delete(ip);
        this.cache.set(ip, info);

        // Evict oldest (first in Map) if we exceed maxEntries to prevent OOM
        if (this.cache.size > this.maxEntries) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }

        const remaining = Math.max(0, this.limit - info.count);
        const success = info.count <= this.limit;

        return {
            success,
            limit: this.limit,
            remaining,
            reset: info.resetTime,
        };
    }
}

export function getClientIp(request: Request): string {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }

    // In Next.js environments, we can attempt to get it from request.ip if it's available,
    // but typically we'll fall back to a default value if not.
    return (request as Request & { ip?: string }).ip || '127.0.0.1';
}

export const authRateLimiter = new RateLimiter({
    limit: 5, // 5 attempts
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxEntries: 10000,
});
