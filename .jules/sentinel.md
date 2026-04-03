## 2024-04-03 - [Security] Add Rate Limiting to Auth Endpoints
**Vulnerability:** The application's authentication endpoints (`/api/auth/pin/login` and `/api/auth/admin/login`) were vulnerable to brute-force attacks due to the lack of rate limiting.
**Learning:** This missing rate limit could allow attackers to repeatedly attempt to guess employee PINs or admin passwords. The employee PIN login was especially susceptible since it uses short numeric PINs. An LRU caching strategy is necessary for in-memory rate limiters to prevent OOM exhaustion.
**Prevention:** Always add rate limiters, such as the newly implemented `LRURateLimiter`, to endpoints handling authentication or sensitive operations.
