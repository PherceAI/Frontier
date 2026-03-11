## 2024-05-15 - [Information Exposure]
**Vulnerability:** The error handler in `frontend/src/app/api/rooms/route.ts` returned `error.message` and `error.stack` to the client upon catching a database error.
**Learning:** This exposes internal database mechanics and server-side stack traces to the end-user (or potential attacker), violating the principle of failing securely.
**Prevention:** Catch blocks in API routes should log the full error details server-side using `console.error` and return a generic error message to the client.
