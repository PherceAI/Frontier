// In-memory rate limiting utility

type RateLimitRecord = {
    count: number;
    resetTime: number;
};

const store = new Map<string, RateLimitRecord>();

export function rateLimit(
    ip: string,
    limit: number = 5,
    windowMs: number = 60000 // default 1 minute
): { success: boolean; limit: number; remaining: number; reset: number } {
    const now = Date.now();
    const record = store.get(ip);

    if (!record) {
        store.set(ip, {
            count: 1,
            resetTime: now + windowMs,
        });
        return { success: true, limit, remaining: limit - 1, reset: now + windowMs };
    }

    if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + windowMs;
        store.set(ip, record);
        return { success: true, limit, remaining: limit - 1, reset: record.resetTime };
    }

    if (record.count >= limit) {
        return { success: false, limit, remaining: 0, reset: record.resetTime };
    }

    record.count += 1;
    store.set(ip, record);

    return { success: true, limit, remaining: limit - record.count, reset: record.resetTime };
}

// Clean up old entries periodically to avoid memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of store.entries()) {
        if (now > value.resetTime) {
            store.delete(key);
        }
    }
}, 60000).unref?.();
