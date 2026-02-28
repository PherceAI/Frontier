## 2024-05-17 - [CRITICAL] Missing Rate Limiting on PIN Auth
**Vulnerability:** The employee PIN login endpoint (`frontend/src/app/api/auth/pin/login/route.ts`) was entirely missing rate limiting. Given that employees authenticate using short, 4-6 digit numeric PINs, this endpoint was highly vulnerable to trivial brute-force attacks.
**Learning:** Even internal hotel management systems must assume endpoints are public facing or accessible by internal threat actors. Short PINs require aggressive rate limiting as a primary defense since complexity cannot be relied upon.
**Prevention:** All authentication endpoints, especially those using low-entropy secrets (PINs), must implement IP and/or account-based rate limiting immediately upon creation.
