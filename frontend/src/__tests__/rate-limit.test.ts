import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimit } from '../lib/rate-limit';

describe('rateLimit', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        // The file's internal map persists across tests, so we need to mock time carefully
        // Or wait for window expiry. Since we are testing, let's just use different identifiers.
    });

    it('should allow requests under the limit', () => {
        const id = 'test-ip-1';
        for (let i = 0; i < 5; i++) {
            const res = rateLimit(id, 5, 60000);
            expect(res.success).toBe(true);
        }
    });

    it('should block requests over the limit', () => {
        const id = 'test-ip-2';
        for (let i = 0; i < 5; i++) {
            const res = rateLimit(id, 5, 60000);
            expect(res.success).toBe(true);
        }

        const res = rateLimit(id, 5, 60000);
        expect(res.success).toBe(false);
        expect(res.remaining).toBe(0);
    });

    it('should reset after the window expires', () => {
        const id = 'test-ip-3';
        rateLimit(id, 1, 60000);
        const resBlocked = rateLimit(id, 1, 60000);
        expect(resBlocked.success).toBe(false);

        vi.advanceTimersByTime(60001);

        const resAllowed = rateLimit(id, 1, 60000);
        expect(resAllowed.success).toBe(true);
    });
});
