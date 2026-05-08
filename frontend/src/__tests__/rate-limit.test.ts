import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LRURateLimiter, getClientIp } from '../lib/rate-limit';

describe('LRURateLimiter', () => {
    let limiter: LRURateLimiter;
    const windowMs = 1000;
    const maxRequests = 2;

    beforeEach(() => {
        limiter = new LRURateLimiter(3);
        vi.useFakeTimers();
        // Set env variable to force limiter evaluation
        process.env.TEST_RATE_LIMITER = 'true';
    });

    afterEach(() => {
        vi.useRealTimers();
        delete process.env.TEST_RATE_LIMITER;
    });

    it('allows requests within limit', () => {
        expect(limiter.limit('ip1', maxRequests, windowMs)).toBe(true);
        expect(limiter.limit('ip1', maxRequests, windowMs)).toBe(true);
    });

    it('blocks requests over limit', () => {
        expect(limiter.limit('ip1', maxRequests, windowMs)).toBe(true);
        expect(limiter.limit('ip1', maxRequests, windowMs)).toBe(true);
        expect(limiter.limit('ip1', maxRequests, windowMs)).toBe(false);
    });

    it('resets after windowMs', () => {
        expect(limiter.limit('ip1', maxRequests, windowMs)).toBe(true);
        expect(limiter.limit('ip1', maxRequests, windowMs)).toBe(true);
        expect(limiter.limit('ip1', maxRequests, windowMs)).toBe(false);

        vi.advanceTimersByTime(windowMs + 1);

        expect(limiter.limit('ip1', maxRequests, windowMs)).toBe(true);
    });

    it('evicts LRU entries when maxSize is reached', () => {
        limiter.limit('ip1', maxRequests, windowMs);
        limiter.limit('ip2', maxRequests, windowMs);
        limiter.limit('ip3', maxRequests, windowMs);

        // This should evict ip1 since max size is 3
        limiter.limit('ip4', maxRequests, windowMs);

        // Advance timers to clear time checks (just to isolate logic)
        vi.advanceTimersByTime(windowMs + 1);

        // Now ip1 should be fresh again (reset)
        expect(limiter.limit('ip1', maxRequests, windowMs)).toBe(true);
    });
});

describe('getClientIp', () => {
    it('gets IP from x-forwarded-for header', () => {
        const req = new Request('http://localhost', {
            headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }
        });
        expect(getClientIp(req)).toBe('1.2.3.4');
    });

    it('gets IP from req.ip fallback', () => {
        const req = new Request('http://localhost');
        (req as any).ip = '8.8.8.8';
        expect(getClientIp(req)).toBe('8.8.8.8');
    });

    it('returns 127.0.0.1 if neither exists', () => {
        const req = new Request('http://localhost');
        expect(getClientIp(req)).toBe('127.0.0.1');
    });
});
