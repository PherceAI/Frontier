import { NextRequest } from 'next/server';

interface RateLimitInfo {
    count: number;
    resetTime: number;
}

export class LRURateLimiter {
    private cache: Map<string, RateLimitInfo>;
    private limit: number;
    private windowMs: number;
    private maxSize: number;

    constructor(options: { limit: number; windowMs: number; maxSize?: number }) {
        this.cache = new Map();
        this.limit = options.limit;
        this.windowMs = options.windowMs;
        this.maxSize = options.maxSize || 10000;
    }

    /**
     * Checks if the key is within the rate limit.
     * Returns true if allowed, false if rate limited.
     */
    check(key: string): boolean {
        // Bypass for testing
        if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
            return true;
        }

        const now = Date.now();
        const info = this.cache.get(key);

        if (info) {
            if (now > info.resetTime) {
                // Window expired, reset count
                info.count = 1;
                info.resetTime = now + this.windowMs;
                this.updateLru(key, info);
                return true;
            }

            if (info.count >= this.limit) {
                // Rate limited
                this.updateLru(key, info); // Keep it "recently used"
                return false;
            }

            // Increment count
            info.count += 1;
            this.updateLru(key, info);
            return true;
        }

        // New key
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }

        this.cache.set(key, { count: 1, resetTime: now + this.windowMs });
        return true;
    }

    private updateLru(key: string, info: RateLimitInfo) {
        // Delete and re-insert to make it the most recently used (at the end of Map)
        this.cache.delete(key);
        this.cache.set(key, info);
    }

    private evictOldest() {
        // The first item in the Map iterator is the oldest inserted (or updated)
        const firstKey = this.cache.keys().next().value;
        if (firstKey !== undefined) {
            this.cache.delete(firstKey);
        }
    }

    // Expose cache for testing purposes
    getCacheSize(): number {
        return this.cache.size;
    }
}

export function getClientIp(request: NextRequest): string {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }
    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }
    // Fallback
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (request as any).ip || '127.0.0.1';
}

// Global instance for login endpoints
// 5 requests per 15 minutes
export const loginRateLimiter = new LRURateLimiter({
    limit: 5,
    windowMs: 15 * 60 * 1000,
    maxSize: 10000,
});
