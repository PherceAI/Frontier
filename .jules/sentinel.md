## 2024-04-02 - Fixed stack trace leakage in API responses
**Vulnerability:** The API endpoint `frontend/src/app/api/rooms/route.ts` included `error.stack` and raw error messages in the `NextResponse.json` error payload when database queries failed.
**Learning:** Returning detailed error objects to the client, especially database errors and stack traces, exposes internal infrastructure and paths that can aid attackers.
**Prevention:** Catch blocks should log full error details server-side (`console.error`) for debugging, but only return sanitized, generic error messages to the client. Avoid ever serializing raw Error objects or their `stack` properties directly into API responses.
