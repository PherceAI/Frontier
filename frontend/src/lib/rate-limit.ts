export class RateLimiter {
    private timestamps: Map<string, number[]> = new Map();
    private windowMs: number;
    private maxRequests: number;
    private maxMapSize: number;

    constructor(windowMs: number, maxRequests: number, maxMapSize: number = 10000) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
        this.maxMapSize = maxMapSize;
    }

    check(ip: string): boolean {
        const now = Date.now();
        const windowStart = now - this.windowMs;

        // Cleanup: remove entries that are completely empty/expired to prevent memory leak
        if (this.timestamps.size >= this.maxMapSize) {
            for (const [key, times] of this.timestamps.entries()) {
                const validTimes = times.filter(timestamp => timestamp > windowStart);
                if (validTimes.length === 0) {
                    this.timestamps.delete(key);
                } else {
                    this.timestamps.set(key, validTimes);
                }
            }
            // If still full after cleanup, apply a blunt defense to prevent OOM
            if (this.timestamps.size >= this.maxMapSize) {
                this.timestamps.clear();
            }
        }

        let ipTimestamps = this.timestamps.get(ip) || [];
        ipTimestamps = ipTimestamps.filter(timestamp => timestamp > windowStart);
        ipTimestamps.push(now);

        this.timestamps.set(ip, ipTimestamps);

        return ipTimestamps.length <= this.maxRequests;
    }
}

// 5 requests per minute (60,000 ms)
export const loginRateLimiter = new RateLimiter(60 * 1000, 5);
