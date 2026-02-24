import { POST } from '@/app/api/auth/pin/login/route';
import { NextRequest } from 'next/server';
import { describe, it, expect, vi } from 'vitest';

// Mock dependencies to avoid DB calls
vi.mock('@/lib/prisma', () => ({
  prisma: {
    employee: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

describe('PIN Login Rate Limiting (Integration)', () => {
  it('should enforce rate limits', async () => {
    const ip = '10.0.0.1'; // Unique IP for this test

    // Make 5 allowed requests
    for (let i = 0; i < 5; i++) {
      const req = new NextRequest('http://localhost:3000/api/auth/pin/login', {
        method: 'POST',
        body: JSON.stringify({ pin: '1234' }),
        headers: { 'x-forwarded-for': ip },
      });
      const res = await POST(req);
      // It should be 401 because prisma returns empty array, but NOT 429
      expect(res.status).not.toBe(429);
    }

    // Make 6th request (should be blocked)
    const req = new NextRequest('http://localhost:3000/api/auth/pin/login', {
      method: 'POST',
      body: JSON.stringify({ pin: '1234' }),
      headers: { 'x-forwarded-for': ip },
    });
    const res = await POST(req);
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});
