## 2024-04-07 - Information Leakage via Database Error Stack Traces
**Vulnerability:** The API endpoint `/api/rooms/route.ts` was returning raw `error.message` and `error.stack` from the Supabase `pg` client directly to the user in HTTP 500 responses.
**Learning:** Returning unhandled database exceptions exposes sensitive infrastructure details (like query structures and connection paths) to potential attackers. The app's convention requires client-facing errors to be in Spanish.
**Prevention:** Catch blocks in API routes must log full details server-side (`console.error(error)`) and return generic, sanitized error messages (e.g., "Error interno del servidor al consultar la base de datos.") to the client.
