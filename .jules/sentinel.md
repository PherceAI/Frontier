## 2024-05-24 - Rate Limiting on PIN Logins
**Vulnerability:** PIN logins (4-6 digits) are extremely susceptible to brute force attacks due to the small key space. A lack of rate limiting allowed an attacker to guess PINs infinitely.
**Learning:** Even though hashes are used in the DB, it doesn't protect the live endpoint from being hammered. Rainbow tables are irrelevant when the live system can just be brute-forced. Rate limiting is the primary defense here.
**Prevention:** Implement IP-based rate limiting (e.g. max 5 attempts per minute) on all sensitive authentication endpoints, especially PIN-based ones. Apply uniformly using an in-memory or Redis-based rate limiter utility.
