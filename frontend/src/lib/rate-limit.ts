import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

// In-memory store for rate limiting
// Note: This resets on server restart and is not shared across multiple instances.
// For a production environment with multiple instances, use Redis or a similar external store.
const ipRequests = new Map<string, { count: number; startTime: number }>();

// Cleanup interval to prevent memory leaks (runs every 10 minutes)
const CLEANUP_INTERVAL = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  for (const [ip, data] of ipRequests.entries()) {
    if (now - data.startTime > 24 * 60 * 60 * 1000) { // Clear entries older than 24 hours (just in case)
       ipRequests.delete(ip);
    }
  }
  lastCleanup = now;
}

/**
 * Basic in-memory rate limiter.
 * @param request The incoming NextRequest
 * @param config Configuration for rate limiting (default: 5 requests per 1 minute)
 * @returns NextResponse if limit exceeded, null otherwise
 */
export function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = { limit: 5, windowMs: 60 * 1000 }
): NextResponse | null {
  // Simple cleanup check on each request to keep map size manageable
  cleanup();

  // Get IP address
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';

  const now = Date.now();
  const record = ipRequests.get(ip);

  if (!record) {
    ipRequests.set(ip, { count: 1, startTime: now });
    return null;
  }

  // Check if window has expired
  if (now - record.startTime > config.windowMs) {
    ipRequests.set(ip, { count: 1, startTime: now });
    return null;
  }

  // Check if limit exceeded
  if (record.count >= config.limit) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Demasiados intentos. Por favor espere antes de intentar nuevamente.'
        }
      },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(config.windowMs / 1000)) } }
    );
  }

  // Increment count
  record.count++;
  return null;
}
