import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { isRateLimited } from '@/lib/rate-limit';

describe('Rate Limiter', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    // remove test bypass
    delete process.env.NODE_ENV;
    delete process.env.VITEST;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should allow 5 requests within the window and block the 6th', () => {
    const req = new NextRequest('http://localhost', {
      headers: new Headers({ 'x-forwarded-for': '192.168.1.1' }),
    });

    for (let i = 0; i < 5; i++) {
      expect(isRateLimited(req)).toBe(false);
    }
    expect(isRateLimited(req)).toBe(true);
  });

  it('should bypass in test environment', () => {
    process.env.NODE_ENV = 'test';
    const req = new NextRequest('http://localhost', {
      headers: new Headers({ 'x-forwarded-for': '192.168.1.2' }),
    });

    for (let i = 0; i < 10; i++) {
      expect(isRateLimited(req)).toBe(false);
    }
  });
});
