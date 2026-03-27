type RateLimitStore = Map<string, { count: number; expiresAt: number }>;

const rateLimitStore: RateLimitStore = new Map();

/**
 * Simple in-memory rate limiter.
 * Note: In a serverless environment (like Vercel), this state is not shared across lambda instances.
 * For production with multiple instances, use Redis or a database.
 * However, this provides a basic layer of protection against rapid-fire scripts on a single instance.
 *
 * @param key Unique key for the requester (e.g., IP address).
 * @param limit Max number of requests allowed.
 * @param windowMs Time window in milliseconds.
 * @returns {boolean} True if the limit is exceeded, false otherwise.
 */
export function rateLimit(key: string, limit: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = rateLimitStore.get(key);

    // Clean up expired entry
    if (record && now > record.expiresAt) {
        rateLimitStore.delete(key);
    }

    const currentRecord = rateLimitStore.get(key);

    if (!currentRecord) {
        rateLimitStore.set(key, {
            count: 1,
            expiresAt: now + windowMs,
        });
        return false;
    }

    if (currentRecord.count >= limit) {
        return true;
    }

    currentRecord.count += 1;
    return false;
}
