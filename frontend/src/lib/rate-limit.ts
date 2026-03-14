import { NextRequest } from 'next/server';

interface RateLimitConfig {
    limit: number;
    windowMs: number;
    maxMapSize?: number;
}

interface RateLimitInfo {
    count: number;
    resetTime: number;
}

export class RateLimiter {
    // Map preserves insertion order, which we use to simulate an LRU cache.
    private store = new Map<string, RateLimitInfo>();
    private readonly limit: number;
    private readonly windowMs: number;
    private readonly maxMapSize: number;

    constructor(config: RateLimitConfig) {
        this.limit = config.limit;
        this.windowMs = config.windowMs;
        this.maxMapSize = config.maxMapSize || 10000;
    }

    /**
     * Checks if the given key has exceeded the rate limit.
     * Returns an object containing information about the rate limit status.
     */
    public check(key: string): { success: boolean; limit: number; remaining: number; reset: Date } {
        const now = Date.now();

        let info = this.store.get(key);

        if (!info) {
            // Instead of blocking new requests and causing a global DoS,
            // we evict the oldest entry (the first key in the map) if we hit the capacity.
            if (this.store.size >= this.maxMapSize) {
                this.evictOldest();
            }

            info = {
                count: 0,
                resetTime: now + this.windowMs,
            };
            this.store.set(key, info);
        } else {
            // Reset the resetTime to extend the window if needed, or simply let it expire
            // If expired, reset the count
            if (now > info.resetTime) {
                info.count = 0;
                info.resetTime = now + this.windowMs;
            }

            // To maintain LRU order, we delete and re-insert the key so it moves to the end.
            this.store.delete(key);
            this.store.set(key, info);
        }

        info.count++;

        const remaining = Math.max(0, this.limit - info.count);
        const success = info.count <= this.limit;

        return {
            success,
            limit: this.limit,
            remaining,
            reset: new Date(info.resetTime)
        };
    }

    /**
     * Evicts the oldest entry from the map to prevent OOM.
     * Since Map preserves insertion order, the first key returned by `.keys()` is the oldest.
     */
    private evictOldest() {
        const firstKey = this.store.keys().next().value;
        if (firstKey !== undefined) {
            this.store.delete(firstKey);
        }
    }
}

/**
 * Extracts the real client IP from the request, preferring the x-forwarded-for header.
 */
export function getClientIp(request: NextRequest): string {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }
    return request.ip || '127.0.0.1';
}

// Global instance for authentication endpoints
// Allow 5 attempts per 15 minutes
export const authRateLimiter = new RateLimiter({
    limit: 5,
    windowMs: 15 * 60 * 1000,
});
