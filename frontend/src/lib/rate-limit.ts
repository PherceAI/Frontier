interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

const store: RateLimitStore = {};

// Clean up expired entries every minute
setInterval(() => {
    const now = Date.now();
    for (const key in store) {
        if (store[key].resetTime <= now) {
            delete store[key];
        }
    }
}, 60000);

export function rateLimit(key: string, limit: number, windowMs: number) {
    const now = Date.now();
    const record = store[key];

    if (!record || record.resetTime <= now) {
        store[key] = {
            count: 1,
            resetTime: now + windowMs,
        };
        return { success: true, remaining: limit - 1, reset: store[key].resetTime };
    }

    if (record.count >= limit) {
        return { success: false, remaining: 0, reset: record.resetTime };
    }

    record.count += 1;
    return { success: true, remaining: limit - record.count, reset: record.resetTime };
}
