## 2024-03-21 - [High] Added Rate Limiting to Authentication Endpoints
**Vulnerability:** Missing rate limit mechanism on login endpoints (`/auth/pin/login` and `/auth/admin/login`).
**Learning:** The lack of rate-limiting allowed potential brute-forcing attacks against user credentials and PINs. An in-memory cache was chosen with an LRU eviction strategy based on Map's order preservation and size limitations to prevent OOM vulnerabilities from spoofed IPs.
**Prevention:** Ensured IP extraction considers `x-forwarded-for` and the rate limiter size is capped to prevent memory exhaustion, while allowing testing bypass to prevent CI/CD failures. Always wrap authentication controllers with a rate limiting guard.
