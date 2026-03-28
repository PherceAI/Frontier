## 2025-03-28 - Information Disclosure (Stack Trace Leakage)
**Vulnerability:** The API endpoint `frontend/src/app/api/rooms/route.ts` leaked internal database connection error details, including stack traces, to the client via `NextResponse.json` in the catch block.
**Learning:** Returning unhandled database errors and stack traces to clients can expose internal structure and technology stack information, which can be useful to attackers trying to map the server.
**Prevention:** Catch blocks must log full error details server-side using `console.error` and return only generic, sanitized error messages to the client. Ensure no internal properties such as `error.message` (from untrusted sources) or `error.stack` are included in JSON responses.
