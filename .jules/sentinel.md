## 2024-03-25 - Prevented information disclosure in API routes
**Vulnerability:** The API route `frontend/src/app/api/rooms/route.ts` was returning sensitive stack trace information (`error.stack` and `error.message`) in its JSON error response to clients during exceptions.
**Learning:** This reveals database internals, query context, or filesystem paths to users/attackers on failure, which is a common security pitfall in Next.js API routes where error handling is sent raw to the response.
**Prevention:** Avoid sending the raw error object or stack traces in `NextResponse.json` error blocks. Always use generic error codes and messages for client-facing API responses while keeping full details logged server-side (`console.error`).
