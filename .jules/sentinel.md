
## 2024-06-12 - Insecure Direct Object Reference (IDOR) in nested endpoints
**Vulnerability:** Found IDOR vulnerabilities where the endpoints `PATCH /api/operations/tasks/[taskId]`, `PATCH /api/my-tasks/[id]/checklist/[itemId]`, and `PATCH /api/operations/tasks/[taskId]/items/[itemId]` were missing proper tenant and relationship bounds verification.
**Learning:** Querying `findUniqueOrThrow` (or `findFirstOrThrow` without enough criteria) on nested resources by ID alone does not verify if the parent resource or the requestor actually owns the object.
**Prevention:** Always explicitly enforce relationship bounds and tenant isolation (`company_id` and `assigned_to`) by using `prisma.findFirst` returning a 404 response to avoid 500 exceptions, prior to using mutations like `update` or `delete`.
