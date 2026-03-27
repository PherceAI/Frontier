## 2024-05-24 - [PIN Login DoS Protection]
**Vulnerability:** The employee PIN login endpoint iterates over all active employees to find a PIN match (O(N) complexity) and performs bcrypt comparison for each. This allows attackers to exhaust server CPU by sending many requests.
**Learning:** O(N) auth checks combined with expensive hashing functions (bcrypt) are a perfect DoS vector. Rate limiting is the first line of defense, but the underlying query should also be optimized (e.g. searchable hash).
**Prevention:** Always implement rate limiting on sensitive endpoints, especially those with expensive operations. Avoid iterating over all users for authentication.
