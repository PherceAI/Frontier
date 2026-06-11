## 2024-05-24 - Fix IDOR in Task Operations Endpoint
**Vulnerability:** Insecure Direct Object Reference (IDOR) and Unhandled Error in the `/api/operations/tasks/[taskId]` endpoint, potentially allowing employees to access tasks from other companies and causing HTTP 500 crashes if an invalid UUID was provided due to `findFirstOrThrow`.
**Learning:** `findFirstOrThrow` solely based on PK is dangerous for tenancy models because it leaks existence without checking ownership and fails with HTTP 500 when not found.
**Prevention:** To prevent IDOR vulnerabilities in multi-tenant environments, replace `findUniqueOrThrow`/`findFirstOrThrow` with `prisma.findFirst` coupled with the `company_id` constraint and return a custom 404 response to handle missing or unauthorized access gracefully.
