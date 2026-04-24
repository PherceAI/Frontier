## 2024-05-20 - Missing Authorization Checks (IDOR)
**Vulnerability:** Several endpoints like `/api/operations/tasks/[taskId]`, `/api/operations/tasks/[taskId]/items/[itemId]`, and `/api/operations/tasks/[taskId]/evidence/route.ts` were missing authorization checks to ensure that the user owns the `taskId` they were modifying or retrieving.
**Learning:** This is a classic Insecure Direct Object Reference (IDOR) vulnerability. The codebase failed to scope queries to the authenticated user's `company_id`.
**Prevention:** Ensure that all queries and updates explicitly check `company_id` using the user's session context in Prisma operations (e.g. `company_id: user.company_id`). Also, check parent-child relationships (e.g. ensuring an item actually belongs to a task).
