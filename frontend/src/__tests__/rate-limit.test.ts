import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RateLimiter } from '../lib/rate-limit';

describe('RateLimiter', () => {
    let limiter: RateLimiter;

    beforeEach(() => {
        // Create a new rate limiter allowing 3 requests per 1000ms
        limiter = new RateLimiter(1000, 3);
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should allow requests under the limit', () => {
        expect(limiter.check('192.168.1.1')).toBe(true);
        expect(limiter.check('192.168.1.1')).toBe(true);
        expect(limiter.check('192.168.1.1')).toBe(true);
    });

    it('should block requests over the limit', () => {
        expect(limiter.check('10.0.0.1')).toBe(true);
        expect(limiter.check('10.0.0.1')).toBe(true);
        expect(limiter.check('10.0.0.1')).toBe(true);

        // 4th request should be blocked
        expect(limiter.check('10.0.0.1')).toBe(false);
    });

    it('should track different IPs separately', () => {
        // Max out IP 1
        expect(limiter.check('ip1')).toBe(true);
        expect(limiter.check('ip1')).toBe(true);
        expect(limiter.check('ip1')).toBe(true);
        expect(limiter.check('ip1')).toBe(false);

        // IP 2 should still be allowed
        expect(limiter.check('ip2')).toBe(true);
        expect(limiter.check('ip2')).toBe(true);
        expect(limiter.check('ip2')).toBe(true);
        expect(limiter.check('ip2')).toBe(false);
    });

    it('should reset after the window has passed', () => {
        expect(limiter.check('172.16.0.1')).toBe(true);
        expect(limiter.check('172.16.0.1')).toBe(true);
        expect(limiter.check('172.16.0.1')).toBe(true);

        // Over limit
        expect(limiter.check('172.16.0.1')).toBe(false);

        // Advance time by 1001ms (past the 1000ms window)
        vi.advanceTimersByTime(1001);

        // Should be allowed again
        expect(limiter.check('172.16.0.1')).toBe(true);
    });
});
