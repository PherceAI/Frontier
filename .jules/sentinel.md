
## 2024-04-09 - [MEDIUM] Information Disclosure via Stack Trace Leak
**Vulnerability:** In `frontend/src/app/api/rooms/route.ts`, the full database error stack trace (`error.stack`) was being exposed to the client in the JSON response of the catch block.
**Learning:** Returning stack traces or detailed database errors to the client leaks internal system configuration and potential weaknesses, violating the principle of failing securely. The codebase should rely on logging detailed errors server-side (using `console.error` or similar) while returning generic, sanitized error messages (like `Error interno de base de datos`) to the client.
**Prevention:** During code review and future implementations, always ensure that `error.stack` or similar detailed technical data is strictly confined to server-side logs and never propagated to API responses.
