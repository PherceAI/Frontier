## 2024-04-05 - [MEDIUM] Fix information leakage in API errors
**Vulnerability:** Several API routes (`/api/rooms/route.ts`, `/api/operations/tasks/[taskId]/evidence/route.ts`, `/api/operations/tasks/[taskId]/items/[itemId]/evidence/route.ts`) were exposing internal system details in their error responses, such as `error.stack` and `error.message`. This could leak sensitive information like database structures or connection errors to potential attackers.
**Learning:** Returning unhandled exception messages directly to the client in catch blocks is a common anti-pattern that violates the principle of "fail securely".
**Prevention:** Always log the full error details on the server side (e.g., using `console.error`) for debugging, but return generic, sanitized error messages to the client.
