
## 2024-05-18 - [Medium] Fixed Information Exposure in Database Error
**Vulnerability:** The Supabase database connection error handler in `/api/rooms/route.ts` was returning `error.message` and `error.stack` directly to the client in a 500 HTTP response.
**Learning:** Returning unhandled exception payloads in Next.js API routes inadvertently surfaces internal structure, such as source locations, query configurations, or stack details to end users.
**Prevention:** Always log specific details on the server-side with `console.error(error)` and return generic, user-facing error messages (e.g., in Spanish to match the system language) to client responses. Avoid using the explicit `: any` type in `catch (error)` to satisfy TypeScript linters.
