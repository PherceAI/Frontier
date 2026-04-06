import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LRURateLimiter, getClientIp } from '../lib/rate-limit';
import { NextRequest } from 'next/server';

describe('LRURateLimiter', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    // Cache original test env vars
    originalEnv = process.env.NODE_ENV;
    // Set to production to enable rate limiting logic for testing
    process.env.NODE_ENV = 'production';
    delete process.env.VITEST;
  });

  afterEach(() => {
    vi.useRealTimers();
    // Restore env vars
    process.env.NODE_ENV = originalEnv;
    process.env.VITEST = 'true';
  });

  it('allows requests under the limit', () => {
    const limiter = new LRURateLimiter({ maxRequests: 3, windowMs: 1000 });
    expect(limiter.check('1.2.3.4')).toBe(true);
    expect(limiter.check('1.2.3.4')).toBe(true);
    expect(limiter.check('1.2.3.4')).toBe(true);
  });

  it('blocks requests over the limit', () => {
    const limiter = new LRURateLimiter({ maxRequests: 2, windowMs: 1000 });
    expect(limiter.check('2.3.4.5')).toBe(true);
    expect(limiter.check('2.3.4.5')).toBe(true);
    expect(limiter.check('2.3.4.5')).toBe(false); // 3rd request blocked
  });

  it('resets count after window expires', () => {
    const limiter = new LRURateLimiter({ maxRequests: 1, windowMs: 1000 });
    expect(limiter.check('3.4.5.6')).toBe(true);
    expect(limiter.check('3.4.5.6')).toBe(false); // blocked

    // Advance time by 1001ms (just over window)
    vi.advanceTimersByTime(1001);

    expect(limiter.check('3.4.5.6')).toBe(true); // allowed again
  });

  it('enforces LRU cache size limit', () => {
    const limiter = new LRURateLimiter({ maxRequests: 1, windowMs: 1000, maxCacheSize: 2 });

    // Fill cache
    expect(limiter.check('ip1')).toBe(true);
    expect(limiter.check('ip2')).toBe(true);

    // Exceed cache size - this should evict ip1 (least recently used)
    expect(limiter.check('ip3')).toBe(true);

    // Since ip1 was evicted, it acts like a new IP now
    expect(limiter.check('ip1')).toBe(true); // would be false if still in cache

    // Check that ip2 was evicted because ip1 was just added and ip3 was added before that
    expect(limiter.check('ip4')).toBe(true); // evicts ip2
    expect(limiter.check('ip2')).toBe(true); // would be false if still in cache
  });

  it('bypasses in test environment', () => {
    // Enable test environment
    process.env.NODE_ENV = 'test';
    const limiter = new LRURateLimiter({ maxRequests: 1, windowMs: 1000 });

    expect(limiter.check('5.6.7.8')).toBe(true);
    expect(limiter.check('5.6.7.8')).toBe(true); // would be blocked normally
  });
});

describe('getClientIp', () => {
  it('extracts IP from x-forwarded-for header', () => {
    const req = {
      headers: new Headers({
        'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178'
      })
    } as unknown as NextRequest;

    expect(getClientIp(req)).toBe('203.0.113.195');
  });

  it('extracts IP from NextRequest.ip property', () => {
    const req = {
      headers: new Headers(),
      ip: '198.51.100.1'
    } as unknown as NextRequest;

    expect(getClientIp(req)).toBe('198.51.100.1');
  });

  it('returns unknown if no IP found', () => {
    const req = {
      headers: new Headers()
    } as unknown as NextRequest;

    expect(getClientIp(req)).toBe('unknown');
  });
});
