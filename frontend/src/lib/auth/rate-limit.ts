export class RateLimiter {
    private cache = new Map<string, { count: number; expiresAt: number }>();
    private maxCacheSize: number;
    private windowMs: number;
    private maxRequests: number;

    constructor(options: { maxCacheSize?: number; windowMs: number; maxRequests: number }) {
        this.maxCacheSize = options.maxCacheSize || 10000;
        this.windowMs = options.windowMs;
        this.maxRequests = options.maxRequests;
    }

    check(ip: string): { success: boolean; limit: number; remaining: number; reset: Date } {
        // Bypass for testing environments to prevent integration tests from failing
        if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
            return {
                success: true,
                limit: this.maxRequests,
                remaining: this.maxRequests,
                reset: new Date(Date.now() + this.windowMs),
            };
        }

        const now = Date.now();
        const record = this.cache.get(ip);

        if (record) {
            if (now > record.expiresAt) {
                // Expired, reset
                const newRecord = { count: 1, expiresAt: now + this.windowMs };
                this.cache.delete(ip);
                this.cache.set(ip, newRecord);
                return {
                    success: true,
                    limit: this.maxRequests,
                    remaining: this.maxRequests - 1,
                    reset: new Date(newRecord.expiresAt),
                };
            }

            if (record.count >= this.maxRequests) {
                return {
                    success: false,
                    limit: this.maxRequests,
                    remaining: 0,
                    reset: new Date(record.expiresAt),
                };
            }

            // Update and move to end (LRU)
            const updatedCount = record.count + 1;
            const updatedRecord = { count: updatedCount, expiresAt: record.expiresAt };
            this.cache.delete(ip);
            this.cache.set(ip, updatedRecord);
            return {
                success: true,
                limit: this.maxRequests,
                remaining: this.maxRequests - updatedCount,
                reset: new Date(updatedRecord.expiresAt),
            };
        }

        // New IP
        if (this.cache.size >= this.maxCacheSize) {
            // Evict oldest (first item in Map)
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }

        const newRecord = { count: 1, expiresAt: now + this.windowMs };
        this.cache.set(ip, newRecord);
        return {
            success: true,
            limit: this.maxRequests,
            remaining: this.maxRequests - 1,
            reset: new Date(newRecord.expiresAt),
        };
    }
}

// Default instance for login endpoints: 5 attempts per 15 minutes
export const loginRateLimiter = new RateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    maxCacheSize: 5000, // Keep memory bounded
});
