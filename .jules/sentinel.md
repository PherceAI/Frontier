## 2024-06-20 - Add Rate Limiting to Auth Endpoints
**Vulnerability:** The PIN and admin authentication endpoints were missing rate limiting, making them susceptible to brute-force attacks.
**Learning:** In Next.js App Router route handlers, custom rate limiters should use an LRU Cache to avoid OOM memory exhaustion vulnerabilities, and should bypass limits when running in test environments to avoid failing local integration tests.
**Prevention:** Always implement robust rate limiting on endpoints handling authentication or sensitive operations.
