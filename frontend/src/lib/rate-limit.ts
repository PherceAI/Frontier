import { NextRequest, NextResponse } from 'next/server';

// LRU cache implementation to prevent OOM memory exhaustion from spoofed IPs
const store = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(req: NextRequest, limit: number = 5, windowMs: number = 60000): NextResponse | null {
    if (process.env.NODE_ENV === 'test' || process.env.VITEST) return null;

    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : (req.ip || '127.0.0.1');
    const now = Date.now();
    const record = store.get(ip);

    if (record && now < record.resetTime) {
        if (record.count >= limit) {
            return NextResponse.json({ success: false, error: { code: 'RATE_LIMIT', message: 'Demasiados intentos' } }, { status: 429 });
        }
        record.count++;
        // Re-insert to maintain LRU order
        store.delete(ip);
        store.set(ip, record);
    } else {
        // Evict oldest if max size reached
        if (store.size >= 1000) store.delete(store.keys().next().value as string);
        store.set(ip, { count: 1, resetTime: now + windowMs });
    }
    return null;
}
