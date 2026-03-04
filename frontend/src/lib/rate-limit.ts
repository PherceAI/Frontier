interface RateLimitRecord {
    count: number;
    resetTime: number;
}

const rateLimits = new Map<string, RateLimitRecord>();

export function rateLimit(
    identifier: string,
    limit: number = 5,
    windowMs: number = 60000
): { success: boolean; limit: number; remaining: number; resetTime: number } {
    const now = Date.now();
    let record = rateLimits.get(identifier);

    if (!record || now > record.resetTime) {
        // First time or window expired
        record = {
            count: 1,
            resetTime: now + windowMs,
        };
        rateLimits.set(identifier, record);
    } else {
        // Inside window
        record.count++;
    }

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
        for (const [key, value] of rateLimits.entries()) {
            if (now > value.resetTime) {
                rateLimits.delete(key);
            }
        }
    }

    const remaining = Math.max(0, limit - record.count);
    const success = record.count <= limit;

    return {
        success,
        limit,
        remaining,
        resetTime: record.resetTime,
    };
}
