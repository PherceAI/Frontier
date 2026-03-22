## 2024-03-22 - Prevent Information Exposure via Error Stack Traces
**Vulnerability:** Information exposure through database stack traces leaked in API route catch blocks.
**Learning:** API routes were returning the raw `error.message` and `error.stack` back to the client directly via `NextResponse.json()`. This can provide attackers with sensitive insights into the database structure or internal components, which may be leveraged for further exploitation.
**Prevention:** Always log the full exception server-side for debugging purposes, but return a generic, sanitized error message (in Spanish for user-facing consistency in this app) to the client. Never expose stack traces or raw database error messages over the network.
