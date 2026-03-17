## 2025-03-17 - [MEDIUM] Fix stack trace exposure in rooms API
**Vulnerability:** The `/api/rooms/route.ts` endpoint was exposing raw database error messages and full stack traces to the client via its API response in a `catch` block (`error.stack` and `error.message`).
**Learning:** Returning unhandled exception payloads directly to API consumers leaks implementation details (such as Supabase connection mechanisms and local server environments) which could be leveraged to find further exploitation avenues.
**Prevention:** Always log specific or full error details server-side (`console.error`), and return generic sanitized strings like `'Error al consultar la base de datos'` in the response payload.
