## 2024-04-12 - Critical Rate Limit & Information Leakage Vulnerabilities
**Vulnerability:**
1. Missing Rate Limits: The `login` endpoints (`/api/auth/pin/login` and `/api/auth/admin/login`) completely lacked rate limiting logic. The PIN login was particularly vulnerable to enumeration/brute-force.
2. Information Leakage: The Rooms endpoint (`/api/rooms/route.ts`) was dumping raw `error.message` and `error.stack` details from Postgres connection failures directly into the API responses.

**Learning:**
1. Lack of centralized rate-limiting logic led to critical endpoints being completely exposed. Custom Node.js/Next.js memory limiters need careful attention to prevent memory leaks (e.g. tracking unbounded IPs).
2. It is easy for developers to accidentally leak stack traces during local development by throwing them into the catch block and forgetting to remove them before production deployments.

**Prevention:**
1. Created an LRU `Map`-based RateLimiter (`frontend/src/lib/rate-limit.ts`) which protects against OOM vulnerabilities while mitigating brute force attacks. Integrated it into `pin` and `admin` login endpoints.
2. Modified the catch blocks to keep stack traces securely on the server console using `console.error()`, while only responding to the client with generic, sanitized messages.