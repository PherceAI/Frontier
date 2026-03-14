import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { RateLimiter, getClientIp } from '@/lib/rate-limit';

describe('RateLimiter', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should allow requests within limit', () => {
        const limiter = new RateLimiter({ limit: 3, windowMs: 1000 });
        const key = 'test_ip';

        expect(limiter.check(key).success).toBe(true);
        expect(limiter.check(key).success).toBe(true);
        expect(limiter.check(key).success).toBe(true);
    });

    it('should block requests exceeding limit', () => {
        const limiter = new RateLimiter({ limit: 2, windowMs: 1000 });
        const key = 'test_ip';

        limiter.check(key);
        limiter.check(key);
        const result = limiter.check(key);

        expect(result.success).toBe(false);
        expect(result.remaining).toBe(0);
    });

    it('should reset limit after windowMs', () => {
        const limiter = new RateLimiter({ limit: 1, windowMs: 1000 });
        const key = 'test_ip';

        limiter.check(key);
        expect(limiter.check(key).success).toBe(false);

        vi.advanceTimersByTime(1001);

        // Attempt after window should succeed
        const result = limiter.check(key);
        expect(result.success).toBe(true);
        expect(result.remaining).toBe(0); // 1 limit - 1 count
    });

    it('should prevent OOM by respecting maxMapSize via LRU eviction', () => {
        const maxMapSize = 3;
        const limiter = new RateLimiter({ limit: 1, windowMs: 1000, maxMapSize });

        limiter.check('ip1'); // This will be the oldest
        limiter.check('ip2');
        limiter.check('ip3');

        // Adding fourth should evict ip1, but ip4 should succeed (within limit 1)
        const result = limiter.check('ip4');
        expect(result.success).toBe(true);

        // Since ip1 was evicted, a new request for ip1 should succeed again
        const resultIp1 = limiter.check('ip1');
        expect(resultIp1.success).toBe(true);
    });

    it('should maintain LRU order when existing keys are accessed', () => {
        const maxMapSize = 3;
        const limiter = new RateLimiter({ limit: 10, windowMs: 1000, maxMapSize });

        limiter.check('ip1');
        limiter.check('ip2');
        limiter.check('ip3');

        // Access ip1 again. Now ip2 should be the oldest.
        limiter.check('ip1');

        // This should evict ip2
        limiter.check('ip4');

        // Since ip2 was evicted, its count is reset, so checking it again should work
        // and its remaining should be 9 (10 limit - 1 count)
        const resultIp2 = limiter.check('ip2');
        expect(resultIp2.success).toBe(true);
        expect(resultIp2.remaining).toBe(9);
    });
});

describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for header', () => {
        const req = new NextRequest('http://localhost', {
            headers: {
                'x-forwarded-for': '192.168.1.1, 10.0.0.1',
            },
        });
        expect(getClientIp(req)).toBe('192.168.1.1');
    });

    it('should fallback to 127.0.0.1 if x-forwarded-for and ip are missing', () => {
        const req = new NextRequest('http://localhost');
        expect(getClientIp(req)).toBe('127.0.0.1');
    });
});
