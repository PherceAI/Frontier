export class RateLimiter {
    private requests: Map<string, number[]>;
    private limit: number;
    private windowMs: number;

    constructor({ limit, windowMs }: { limit: number; windowMs: number }) {
        this.requests = new Map();
        this.limit = limit;
        this.windowMs = windowMs;
    }

    /**
     * Checks if the given IP has exceeded the rate limit.
     * Returns true if rate limited, false otherwise.
     */
    isRateLimited(ip: string): boolean {
        const now = Date.now();
        const windowStart = now - this.windowMs;

        let timestamps = this.requests.get(ip) || [];
        // Remove timestamps older than the window
        timestamps = timestamps.filter((t) => t > windowStart);

        if (timestamps.length >= this.limit) {
            this.requests.set(ip, timestamps); // update anyway to keep recent blocked ones if needed
            return true;
        }

        timestamps.push(now);
        this.requests.set(ip, timestamps);
        return false;
    }
}

// Global instance to persist across API route reloads in development (and reuse in production Next.js edge/node functions if possible)
const globalForRateLimit = global as unknown as { rateLimiter: RateLimiter };

export const rateLimiter =
    globalForRateLimit.rateLimiter ||
    new RateLimiter({
        limit: 5, // 5 requests
        windowMs: 60 * 1000, // per 1 minute
    });

if (process.env.NODE_ENV !== 'production') {
    globalForRateLimit.rateLimiter = rateLimiter;
}
