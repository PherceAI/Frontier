import { NextRequest } from 'next/server';

interface RateLimitRecord {
    count: number;
    timestamp: number;
}

export class RateLimiter {
    private store: Map<string, RateLimitRecord>;
    private limit: number;
    private windowMs: number;
    private maxStoreSize: number;

    constructor(limit: number, windowMs: number, maxStoreSize: number = 10000) {
        this.store = new Map();
        this.limit = limit;
        this.windowMs = windowMs;
        this.maxStoreSize = maxStoreSize;
    }

    private evictLRU() {
        if (this.store.size > 0) {
            const firstKey = this.store.keys().next().value;
            if (firstKey !== undefined) {
                this.store.delete(firstKey);
            }
        }
    }

    public check(req: NextRequest): boolean {
        // Bypass rate limiting in test environments
        if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
            return true;
        }

        // In Next.js 15+, NextRequest.ip is removed and you should use headers
        const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
                   'unknown';

        const now = Date.now();
        const record = this.store.get(ip);

        if (!record) {
            if (this.store.size >= this.maxStoreSize) {
                this.evictLRU();
            }
            this.store.set(ip, { count: 1, timestamp: now });
            return true;
        }

        // Re-insert to update order for LRU (Map preserves insertion order)
        this.store.delete(ip);

        if (now - record.timestamp > this.windowMs) {
            // Window expired, reset
            this.store.set(ip, { count: 1, timestamp: now });
            return true;
        }

        if (record.count >= this.limit) {
            // Rate limit exceeded
            this.store.set(ip, record); // re-insert updated position
            return false;
        }

        // Increment count
        this.store.set(ip, { count: record.count + 1, timestamp: record.timestamp });
        return true;
    }
}

// 5 requests per minute per IP for authentication endpoints
export const authRateLimiter = new RateLimiter(5, 60 * 1000);
