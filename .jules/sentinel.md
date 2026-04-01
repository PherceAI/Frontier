## 2024-04-01 - [Stack Trace Leakage in Rooms API]
**Vulnerability:** The GET endpoint at `frontend/src/app/api/rooms/route.ts` returned the raw database query `error.message` and `error.stack` inside a 500 response payload directly to the client.
**Learning:** Returning unhandled exception payloads in Next.js API endpoints allows attackers to map internal infrastructures and database schema structure, violating the fail-secure principle.
**Prevention:** Ensure catch blocks in Next.js API endpoints only return generic sanitized error messages in `NextResponse.json` payloads (e.g. `Error interno de base de datos`), while logging the detailed, raw stack traces server-side with `console.error` for developer monitoring.
