import { NextRequest } from 'next/server';

interface RateLimitConfig {
    limit: number;
    windowMs: number;
}

interface RateLimitRecord {
    count: number;
    resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const MAX_MAP_SIZE = 10000;

function cleanUpMap() {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
        if (now > record.resetTime) {
            rateLimitMap.delete(ip);
        }
    }
}

export function rateLimit(request: NextRequest, config: RateLimitConfig): boolean {
    const now = Date.now();

    // Try to get IP from x-forwarded-for first
    const forwardedFor = request.headers.get('x-forwarded-for');
    let ip = 'unknown';
    if (forwardedFor) {
        ip = forwardedFor.split(',')[0].trim();
    } else if ((request as any).ip) {
        ip = (request as any).ip;
    }

    // Clean up if the map gets too big to prevent OOM
    if (rateLimitMap.size > MAX_MAP_SIZE) {
        cleanUpMap();
        // If it's still too big, clear it all as a last resort
        if (rateLimitMap.size > MAX_MAP_SIZE) {
            rateLimitMap.clear();
        }
    }

    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
        rateLimitMap.set(ip, {
            count: 1,
            resetTime: now + config.windowMs,
        });
        return true;
    }

    if (record.count >= config.limit) {
        return false;
    }

    record.count++;
    return true;
}
