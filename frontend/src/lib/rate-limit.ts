import { NextRequest } from 'next/server';

interface RateLimitInfo {
    count: number;
    timestamp: number;
}

export class RateLimiter {
    private cache = new Map<string, RateLimitInfo>();
    private maxSize: number;
    private windowMs: number;
    private maxRequests: number;

    constructor(maxRequests: number, windowMs: number, maxSize: number = 1000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.maxSize = maxSize;
    }

    public check(req: NextRequest) {
        // Skip rate limiting during local testing if requested (e.g. vitest integration tests hit login repeatedly)
        if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
            return { success: true, limit: this.maxRequests, remaining: this.maxRequests, reset: Date.now() + this.windowMs };
        }

        const ip = this.getIp(req);
        const now = Date.now();

        let info = this.cache.get(ip);

        // Reset if window has passed
        if (!info || now - info.timestamp > this.windowMs) {
            info = { count: 0, timestamp: now };
        }

        info.count++;

        // Simple LRU: if size exceeded, delete oldest (first) key
        if (!this.cache.has(ip) && this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) this.cache.delete(firstKey);
        }

        // Make it MRU by re-inserting
        if (this.cache.has(ip)) {
            this.cache.delete(ip);
        }
        this.cache.set(ip, info);

        const remaining = Math.max(0, this.maxRequests - info.count);
        const success = info.count <= this.maxRequests;
        const reset = info.timestamp + this.windowMs;

        return { success, limit: this.maxRequests, remaining, reset };
    }

    private getIp(req: NextRequest): string {
        const forwardedFor = req.headers.get('x-forwarded-for');
        if (forwardedFor) {
            return forwardedFor.split(',')[0].trim();
        }
        // In Next.js 15+ App Router, req.ip is removed. Fallback to generic IP if header is missing.
        return '127.0.0.1';
    }
}

// Global instance for login limits (e.g. 50 requests per 15 minutes)
export const loginRateLimiter = new RateLimiter(50, 15 * 60 * 1000, 1000);
