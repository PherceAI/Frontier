
## 2024-05-18 - [Fix Stack Trace Leakage & Add Rate Limiting]
**Vulnerability:**
1. Database stack trace leakage in `/api/rooms/route.ts` through error response.
2. Missing rate limiting on authentication endpoints (`/api/auth/pin/login` and `/api/auth/admin/login`).
**Learning:**
1. `error.stack` was explicitly exposed in Next.js API route JSON responses, posing an information disclosure risk.
2. In-memory rate limiting requires careful memory management. A simple `Map` can grow indefinitely if IPs are spoofed. An LRU eviction strategy based on cache size is required to prevent Out-Of-Memory (OOM) Denial of Service. Also, it needs a bypass in testing environments so integration tests do not falsely fail due to rate limiting limits.
**Prevention:**
1. Ensure all catch blocks in API routes return generic, sanitized error messages (in Spanish as per project convention) to the client and log actual errors to the server console.
2. Standardize rate limiting across all public-facing and authentication endpoints, ensuring proper eviction and IP parsing (`x-forwarded-for` fallback).
