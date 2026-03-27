type RateLimitStore = Map<string, { count: number; lastReset: number }>;

export const rateLimit = (limit: number, windowMs: number) => {
  const store: RateLimitStore = new Map();

  return {
    check: (ip: string) => {
      const now = Date.now();
      const record = store.get(ip) || { count: 0, lastReset: now };

      if (now - record.lastReset > windowMs) {
        record.count = 0;
        record.lastReset = now;
      }

      if (record.count >= limit) {
        return false;
      }

      record.count += 1;
      store.set(ip, record);
      return true;
    },
  };
};
