import { expect, test, describe } from 'vitest';
import { rateLimit } from '../lib/rate-limit';

describe('rateLimit', () => {
    test('allows requests under the limit', () => {
        const mockRequest = { headers: new Map([['x-forwarded-for', '1.2.3.4']]) } as any;
        expect(rateLimit(mockRequest, { limit: 5, windowMs: 1000 })).toBe(true);
        expect(rateLimit(mockRequest, { limit: 5, windowMs: 1000 })).toBe(true);
        expect(rateLimit(mockRequest, { limit: 5, windowMs: 1000 })).toBe(true);
        expect(rateLimit(mockRequest, { limit: 5, windowMs: 1000 })).toBe(true);
        expect(rateLimit(mockRequest, { limit: 5, windowMs: 1000 })).toBe(true);
    });

    test('blocks requests over the limit', () => {
        const mockRequest = { headers: new Map([['x-forwarded-for', '1.2.3.5']]) } as any;
        expect(rateLimit(mockRequest, { limit: 2, windowMs: 1000 })).toBe(true);
        expect(rateLimit(mockRequest, { limit: 2, windowMs: 1000 })).toBe(true);
        expect(rateLimit(mockRequest, { limit: 2, windowMs: 1000 })).toBe(false);
        expect(rateLimit(mockRequest, { limit: 2, windowMs: 1000 })).toBe(false);
    });
});
