import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LRURateLimiter } from '../lib/auth/rate-limit';
import { NextRequest } from 'next/server';

// Save original env
const originalEnv = process.env.NODE_ENV;

describe('LRURateLimiter', () => {
    beforeEach(() => {
        // We need to bypass the test bypass so we actually test the logic
        process.env.NODE_ENV = 'development';
        delete process.env.VITEST;
    });

    afterEach(() => {
        process.env.NODE_ENV = originalEnv;
        process.env.VITEST = 'true';
    });

    const createMockRequest = (ip: string, forwardedFor?: string): NextRequest => {
        const headers = new Headers();
        if (forwardedFor) {
            headers.set('x-forwarded-for', forwardedFor);
        }
        return {
            ip,
            headers,
        } as unknown as NextRequest;
    };

    it('should allow requests under the limit', () => {
        const limiter = new LRURateLimiter({ maxRequests: 2, windowMs: 1000, maxCacheSize: 10 });
        const req = createMockRequest('1.1.1.1');

        expect(limiter.check(req).success).toBe(true);
        expect(limiter.check(req).success).toBe(true);
    });

    it('should block requests over the limit', () => {
        const limiter = new LRURateLimiter({ maxRequests: 2, windowMs: 1000, maxCacheSize: 10 });
        const req = createMockRequest('2.2.2.2');

        expect(limiter.check(req).success).toBe(true);
        expect(limiter.check(req).success).toBe(true);
        expect(limiter.check(req).success).toBe(false);
    });

    it('should reset after windowMs', () => {
        vi.useFakeTimers();
        const limiter = new LRURateLimiter({ maxRequests: 1, windowMs: 1000, maxCacheSize: 10 });
        const req = createMockRequest('3.3.3.3');

        expect(limiter.check(req).success).toBe(true);
        expect(limiter.check(req).success).toBe(false);

        vi.advanceTimersByTime(1001);

        expect(limiter.check(req).success).toBe(true);
        vi.useRealTimers();
    });

    it('should enforce maxCacheSize with LRU eviction', () => {
        const limiter = new LRURateLimiter({ maxRequests: 5, windowMs: 1000, maxCacheSize: 2 });

        const req1 = createMockRequest('1.1.1.1');
        const req2 = createMockRequest('2.2.2.2');
        const req3 = createMockRequest('3.3.3.3');

        // Fill cache
        limiter.check(req1); // cache: req1
        limiter.check(req2); // cache: req1, req2

        // Exceed cache size, should evict req1
        limiter.check(req3); // cache: req2, req3

        // Since req1 was evicted, its count should be reset to 0+1=1, so remaining is 4
        const result1 = limiter.check(req1);
        expect(result1.remaining).toBe(4);
    });

    it('should prioritize x-forwarded-for over ip', () => {
        const limiter = new LRURateLimiter({ maxRequests: 1, windowMs: 1000, maxCacheSize: 10 });

        const req1 = createMockRequest('fallback.ip', 'proxied.ip');
        const req2 = createMockRequest('fallback.ip', 'proxied.ip');

        expect(limiter.check(req1).success).toBe(true);
        expect(limiter.check(req2).success).toBe(false);
    });

    it('should split x-forwarded-for properly', () => {
         const limiter = new LRURateLimiter({ maxRequests: 1, windowMs: 1000, maxCacheSize: 10 });
         const req1 = createMockRequest('fallback.ip', 'proxied.ip, some.other.ip');
         const req2 = createMockRequest('fallback.ip', 'proxied.ip');

         expect(limiter.check(req1).success).toBe(true);
         // The second request should be blocked because it resolves to the same IP ('proxied.ip')
         expect(limiter.check(req2).success).toBe(false);
    });
});
