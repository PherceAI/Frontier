import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimit } from '../lib/rate-limit';

describe('rateLimit', () => {
    beforeEach(() => {
        // Reset the rate limit store by mocking time or using a new key for each test
        // Since rateLimit uses an internal module-level variable, we can't easily reset it without exposing a reset function.
        // Instead, we'll use unique keys for each test case.
        vi.useFakeTimers();
    });

    it('should allow requests under the limit', () => {
        const key = 'test-ip-1';
        expect(rateLimit(key, 2, 60000)).toBe(false);
        expect(rateLimit(key, 2, 60000)).toBe(false);
    });

    it('should block requests over the limit', () => {
        const key = 'test-ip-2';
        expect(rateLimit(key, 2, 60000)).toBe(false);
        expect(rateLimit(key, 2, 60000)).toBe(false);
        expect(rateLimit(key, 2, 60000)).toBe(true);
    });

    it('should reset after window expires', () => {
        const key = 'test-ip-3';
        expect(rateLimit(key, 1, 1000)).toBe(false);
        expect(rateLimit(key, 1, 1000)).toBe(true);

        // Advance time by 1001ms
        vi.advanceTimersByTime(1001);

        expect(rateLimit(key, 1, 1000)).toBe(false);
    });
});
