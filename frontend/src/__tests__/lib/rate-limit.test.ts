import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rateLimit } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

describe('rateLimit', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should allow requests under the limit', () => {
        const ip = '192.168.1.1';
        const req = new NextRequest('http://localhost', { headers: { 'x-forwarded-for': ip } });

        for (let i = 0; i < 5; i++) {
            const res = rateLimit(req, { limit: 5, windowMs: 60000 });
            expect(res).toBeNull();
        }
    });

    it('should block requests over the limit', () => {
        const ip = '192.168.1.2';
        const req = new NextRequest('http://localhost', { headers: { 'x-forwarded-for': ip } });

        // consume limit
        for (let i = 0; i < 5; i++) {
            rateLimit(req, { limit: 5, windowMs: 60000 });
        }

        // next one should be blocked
        const res = rateLimit(req, { limit: 5, windowMs: 60000 });
        expect(res).not.toBeNull();
        expect(res?.status).toBe(429);
    });

    it('should reset after window expires', () => {
        const ip = '192.168.1.3';
        const req = new NextRequest('http://localhost', { headers: { 'x-forwarded-for': ip } });

        // consume limit
        for (let i = 0; i < 5; i++) {
            rateLimit(req, { limit: 5, windowMs: 60000 });
        }

        // Verify blocked
        expect(rateLimit(req, { limit: 5, windowMs: 60000 })).not.toBeNull();

        // Advance time beyond window
        vi.advanceTimersByTime(60001);

        // Should be allowed again
        const res = rateLimit(req, { limit: 5, windowMs: 60000 });
        expect(res).toBeNull();
    });
});
