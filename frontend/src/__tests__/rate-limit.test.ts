import { describe, it, expect } from 'vitest';
import { RateLimiter } from '../lib/rate-limit';

describe('RateLimiter', () => {
    it('should limit requests properly', () => {
        const limiter = new RateLimiter({ limit: 3, windowMs: 10000 });
        const ip = '127.0.0.1';

        expect(limiter.isRateLimited(ip)).toBe(false);
        expect(limiter.isRateLimited(ip)).toBe(false);
        expect(limiter.isRateLimited(ip)).toBe(false);
        expect(limiter.isRateLimited(ip)).toBe(true);
        expect(limiter.isRateLimited(ip)).toBe(true);
    });

    it('should reset limit after windowMs', async () => {
        const limiter = new RateLimiter({ limit: 1, windowMs: 50 });
        const ip = '192.168.1.1';

        expect(limiter.isRateLimited(ip)).toBe(false);
        expect(limiter.isRateLimited(ip)).toBe(true);

        await new Promise(resolve => setTimeout(resolve, 60));

        expect(limiter.isRateLimited(ip)).toBe(false);
    });
});
