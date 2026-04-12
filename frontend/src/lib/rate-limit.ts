import { NextRequest, NextResponse } from 'next/server';

interface RateLimitInfo {
    count: number;
    resetAt: number;
}

export class RateLimiter {
    private cache: Map<string, RateLimitInfo>;
    private limit: number;
    private windowMs: number;
    private maxCapacity: number;

    constructor(options: { limit: number; windowMs: number; maxCapacity?: number }) {
        this.cache = new Map();
        this.limit = options.limit;
        this.windowMs = options.windowMs;
        this.maxCapacity = options.maxCapacity || 10000;
    }

    public check(req: NextRequest, identifier?: string): NextResponse | null {
        // Bypass rate limiting in test environments
        if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
            return null;
        }

        const forwardedFor = req.headers.get('x-forwarded-for');
        let ip = forwardedFor ? forwardedFor.split(',')[0].trim() : undefined;
        if (!ip) {
            ip = (req as any).ip || '127.0.0.1';
        }

        const key = identifier ? `${identifier}:${ip}` : ip;
        if (!key) {
            return null;
        }

        const now = Date.now();

        let info = this.cache.get(key);

        if (!info || info.resetAt < now) {
            info = { count: 1, resetAt: now + this.windowMs };
            this.cache.set(key, info);
        } else {
            info.count += 1;
            // Update LRU property by re-inserting
            this.cache.delete(key);
            this.cache.set(key, info);
        }

        if (this.cache.size > this.maxCapacity) {
            // Remove the oldest element (first inserted)
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }

        if (info.count > this.limit) {
            return NextResponse.json(
                { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Demasiadas solicitudes. Inténtalo de nuevo más tarde.' } },
                { status: 429 }
            );
        }

        return null; // OK
    }
}

// Default export for common auth endpoints
export const authRateLimiter = new RateLimiter({
    limit: 5,           // 5 requests
    windowMs: 60 * 1000, // per 1 minute
    maxCapacity: 10000, // up to 10k unique IPs
});
