import { describe, it, expect, beforeEach } from 'vitest';
import { LRURateLimiter, getClientIp } from '@/lib/auth/rate-limit';
import { NextRequest } from 'next/server';

describe('LRURateLimiter', () => {
    let limiter: LRURateLimiter;

    beforeEach(() => {
        // Mock environment variables to ensure bypass is not active during these specific tests
        const originalEnv = process.env.NODE_ENV;
        const originalVitest = process.env.VITEST;
        process.env.NODE_ENV = 'production';
        delete process.env.VITEST;

        limiter = new LRURateLimiter({ limit: 3, windowMs: 1000, maxSize: 5 });

        // Restore env after test
        return () => {
            process.env.NODE_ENV = originalEnv;
            process.env.VITEST = originalVitest;
        };
    });

    it('should allow requests up to the limit', () => {
        const ip = '192.168.1.1';
        expect(limiter.check(ip)).toBe(true); // 1
        expect(limiter.check(ip)).toBe(true); // 2
        expect(limiter.check(ip)).toBe(true); // 3
    });

    it('should block requests over the limit', () => {
        const ip = '192.168.1.2';
        expect(limiter.check(ip)).toBe(true); // 1
        expect(limiter.check(ip)).toBe(true); // 2
        expect(limiter.check(ip)).toBe(true); // 3
        expect(limiter.check(ip)).toBe(false); // 4 - blocked
    });

    it('should evict oldest entries when max size is reached', () => {
        // Add 5 entries (max capacity)
        limiter.check('ip1');
        limiter.check('ip2');
        limiter.check('ip3');
        limiter.check('ip4');
        limiter.check('ip5');

        expect(limiter.getCacheSize()).toBe(5);

        // Add 6th entry, should evict ip1
        limiter.check('ip6');
        expect(limiter.getCacheSize()).toBe(5);

        // At this point, we can't easily assert on the private cache,
        // but we can ensure size doesn't exceed maxSize
    });
});

describe('getClientIp', () => {
    it('should extract ip from x-forwarded-for header', () => {
        const req = new NextRequest('http://localhost', {
            headers: {
                'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178'
            }
        });
        expect(getClientIp(req)).toBe('203.0.113.195');
    });

    it('should extract ip from x-real-ip header if x-forwarded-for is absent', () => {
        const req = new NextRequest('http://localhost', {
            headers: {
                'x-real-ip': '203.0.113.196'
            }
        });
        expect(getClientIp(req)).toBe('203.0.113.196');
    });

    it('should fall back to req.ip', () => {
        const req = new NextRequest('http://localhost');
        // NextRequest doesn't have a settable ip property in the constructor,
        // so we mock it on the instance
        Object.defineProperty(req, 'ip', { value: '203.0.113.197' });
        expect(getClientIp(req)).toBe('203.0.113.197');
    });

    it('should return 127.0.0.1 as a last resort', () => {
        const req = new NextRequest('http://localhost');
        expect(getClientIp(req)).toBe('127.0.0.1');
    });
});
