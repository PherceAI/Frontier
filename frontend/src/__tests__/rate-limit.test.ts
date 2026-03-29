import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RateLimiter } from '../lib/auth/rate-limit';

describe('RateLimiter', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
        // Mock timers to test expiration
        vi.useFakeTimers();
        // Clear process.env bypass
        process.env.NODE_ENV = 'production';
        process.env.VITEST = '';
    });

    afterEach(() => {
        vi.useRealTimers();
        process.env.NODE_ENV = originalEnv;
        process.env.VITEST = 'true';
    });

    it('should allow requests under the limit', () => {
        const limiter = new RateLimiter({ windowMs: 1000, maxRequests: 2 });

        expect(limiter.check('1.2.3.4').success).toBe(true);
        expect(limiter.check('1.2.3.4').success).toBe(true);
    });

    it('should block requests over the limit', () => {
        const limiter = new RateLimiter({ windowMs: 1000, maxRequests: 2 });

        limiter.check('1.2.3.4');
        limiter.check('1.2.3.4');
        expect(limiter.check('1.2.3.4').success).toBe(false);
    });

    it('should reset after windowMs', () => {
        const limiter = new RateLimiter({ windowMs: 1000, maxRequests: 1 });

        expect(limiter.check('1.2.3.4').success).toBe(true);
        expect(limiter.check('1.2.3.4').success).toBe(false);

        // Advance time past the window
        vi.advanceTimersByTime(1001);

        expect(limiter.check('1.2.3.4').success).toBe(true);
    });

    it('should track different IPs separately', () => {
        const limiter = new RateLimiter({ windowMs: 1000, maxRequests: 1 });

        expect(limiter.check('1.2.3.4').success).toBe(true);
        expect(limiter.check('5.6.7.8').success).toBe(true);
        expect(limiter.check('1.2.3.4').success).toBe(false);
    });

    it('should evict oldest records when maxCacheSize is reached', () => {
        const limiter = new RateLimiter({ windowMs: 10000, maxRequests: 1, maxCacheSize: 2 });

        // Fill the cache
        expect(limiter.check('ip1').success).toBe(true);
        expect(limiter.check('ip2').success).toBe(true);

        // Next request should evict ip1
        expect(limiter.check('ip3').success).toBe(true);

        // ip1 should now be treated as a new IP because it was evicted
        expect(limiter.check('ip1').success).toBe(true);

        // ip2 should still be blocked (if it hasn't been evicted, wait, ip3 evicted ip1, ip1 evicted ip2)
        // Actually, the Map maintains insertion order.
        // 1. set(ip1)
        // 2. set(ip2)
        // 3. check(ip3) -> size >= 2 -> evict first (ip1) -> set(ip3)
        // Now map has [ip2, ip3]
        // 4. check(ip1) -> size >= 2 -> evict first (ip2) -> set(ip1)
        // Now map has [ip3, ip1]
        // So ip2 should now be treated as new, and be allowed.
        expect(limiter.check('ip2').success).toBe(true);
    });

    it('should bypass in test environment', () => {
        process.env.NODE_ENV = 'test';
        const limiter = new RateLimiter({ windowMs: 1000, maxRequests: 1 });

        expect(limiter.check('1.2.3.4').success).toBe(true);
        expect(limiter.check('1.2.3.4').success).toBe(true);
        expect(limiter.check('1.2.3.4').success).toBe(true);
    });
});
