import { NextRequest } from 'next/server';

interface RateLimitInfo {
    count: number;
    lastReset: number;
}

interface RateLimitConfig {
    limit: number;
    windowMs: number;
    maxEntries?: number;
}

export class RateLimiter {
    private cache: Map<string, RateLimitInfo>;
    private limit: number;
    private windowMs: number;
    private maxEntries: number;

    constructor(config: RateLimitConfig) {
        this.cache = new Map();
        this.limit = config.limit;
        this.windowMs = config.windowMs;
        this.maxEntries = config.maxEntries || 10000;
    }

    public check(req: NextRequest): boolean {
        // Bypass in testing environments
        if (process.env.NODE_ENV === 'test' || process.env.VITEST || process.env.VITEST === 'true') {
            return true;
        }

        const ip = this.getIp(req);
        const now = Date.now();

        if (!this.cache.has(ip)) {
            // Check for max entries to prevent OOM
            if (this.cache.size >= this.maxEntries) {
                // Implement LRU eviction
                const firstKey = this.cache.keys().next().value;
                if (firstKey) this.cache.delete(firstKey);
            }
            this.cache.set(ip, { count: 1, lastReset: now });
            return true;
        }

        const info = this.cache.get(ip)!;

        // Reset window if elapsed
        if (now - info.lastReset > this.windowMs) {
            info.count = 1;
            info.lastReset = now;
            // Move to end (most recently used)
            this.cache.delete(ip);
            this.cache.set(ip, info);
            return true;
        }

        info.count += 1;
        // Move to end (most recently used)
        this.cache.delete(ip);
        this.cache.set(ip, info);

        return info.count <= this.limit;
    }

    private getIp(req: NextRequest): string {
        const forwardedFor = req.headers.get('x-forwarded-for');
        if (forwardedFor) {
            return forwardedFor.split(',')[0].trim();
        }
        // Fallback for NextRequest where ip might be undefined
        return req.ip || '127.0.0.1';
    }
}

// Export a singleton instance for authentication endpoints
// Allow 5 requests per minute
export const authRateLimiter = new RateLimiter({
    limit: 5,
    windowMs: 60 * 1000,
    maxEntries: 10000
});
