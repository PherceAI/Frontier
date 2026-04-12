import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { authRateLimiter, RateLimiter } from '../../src/lib/rate-limit';

describe('RateLimiter', () => {
    let originalEnv: string | undefined;

    let originalVitestEnv: string | undefined;

    beforeEach(() => {
        originalEnv = process.env.NODE_ENV;
        originalVitestEnv = process.env.VITEST;
        process.env.NODE_ENV = 'production';
        delete process.env.VITEST;
    });

    afterEach(() => {
        process.env.NODE_ENV = originalEnv;
        if (originalVitestEnv !== undefined) {
            process.env.VITEST = originalVitestEnv;
        }
    });

    it('should bypass in test environment', () => {
        process.env.NODE_ENV = 'test';
        process.env.VITEST = 'true';
        const limiter = new RateLimiter({ limit: 1, windowMs: 1000 });
        const req = new NextRequest('http://localhost:3000/api', { headers: { 'x-forwarded-for': '1.2.3.4' } });

        expect(limiter.check(req)).toBeNull();
        expect(limiter.check(req)).toBeNull(); // Should not hit limit
    });

    it('should allow requests within limit', () => {
        const limiter = new RateLimiter({ limit: 2, windowMs: 1000 });
        const req = new NextRequest('http://localhost:3000/api', { headers: { 'x-forwarded-for': '1.2.3.5' } });

        expect(limiter.check(req)).toBeNull();
        expect(limiter.check(req)).toBeNull();
    });

    it('should block requests exceeding limit', () => {
        const limiter = new RateLimiter({ limit: 2, windowMs: 1000 });
        const req = new NextRequest('http://localhost:3000/api', { headers: { 'x-forwarded-for': '1.2.3.6' } });

        limiter.check(req);
        limiter.check(req);
        const res = limiter.check(req);

        expect(res).not.toBeNull();
        expect(res?.status).toBe(429);
    });

    it('should reset limit after windowMs', () => {
        vi.useFakeTimers();
        const limiter = new RateLimiter({ limit: 1, windowMs: 1000 });
        const req = new NextRequest('http://localhost:3000/api', { headers: { 'x-forwarded-for': '1.2.3.7' } });

        expect(limiter.check(req)).toBeNull();
        expect(limiter.check(req)).not.toBeNull();

        vi.advanceTimersByTime(1001);

        expect(limiter.check(req)).toBeNull();
        vi.useRealTimers();
    });

    it('should handle missing key gracefully', () => {
        const limiter = new RateLimiter({ limit: 1, windowMs: 1000 });
        const req = new NextRequest('http://localhost:3000/api', { headers: { 'x-forwarded-for': '' } });

        // Force empty IP simulation
        Object.defineProperty(req, 'ip', { value: '' });

        expect(limiter.check(req)).toBeNull();
    });
});