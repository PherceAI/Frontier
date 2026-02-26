import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rateLimit } from '@/lib/rate-limit';

describe('rateLimit', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should allow requests within limit', () => {
        const key = 'test-ip-1';
        const limit = 5;
        const windowMs = 60000;

        for (let i = 0; i < limit; i++) {
            const result = rateLimit(key, limit, windowMs);
            expect(result.success).toBe(true);
            expect(result.remaining).toBe(limit - 1 - i);
        }
    });

    it('should block requests exceeding limit', () => {
        const key = 'test-ip-2';
        const limit = 3;
        const windowMs = 60000;

        // Consume limit
        for (let i = 0; i < limit; i++) {
            rateLimit(key, limit, windowMs);
        }

        // Exceed limit
        const result = rateLimit(key, limit, windowMs);
        expect(result.success).toBe(false);
        expect(result.remaining).toBe(0);
    });

    it('should reset after window expires', () => {
        const key = 'test-ip-3';
        const limit = 2;
        const windowMs = 1000;

        // Consume limit
        rateLimit(key, limit, windowMs);
        rateLimit(key, limit, windowMs);

        // Advance time
        vi.advanceTimersByTime(windowMs + 100);

        // Should be allowed again
        const result = rateLimit(key, limit, windowMs);
        expect(result.success).toBe(true);
        expect(result.remaining).toBe(limit - 1);
    });
});
