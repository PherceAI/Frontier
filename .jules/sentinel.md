## 2024-06-26 - IDOR in Nested Checklist Resource

**Vulnerability:** A critical Insecure Direct Object Reference (IDOR) vulnerability was found in the `PATCH /api/my-tasks/[id]/checklist/[itemId]` endpoint. The query `prisma.taskChecklistItem.findUniqueOrThrow({ where: { id: parseInt(itemId) } })` only used the `itemId` from the URL, allowing any authenticated user to modify checklist items belonging to other tenants' tasks by guessing the `itemId`.

**Learning:** When validating nested resources (like `tasks/[id]/checklist/[itemId]`), simply requiring a valid session is insufficient. You must explicitly query the database to verify the relationship between the child resource (`itemId`) and its parent (`taskId` or `id`), and ensure the parent resource belongs to the current tenant (`company_id`) and/or authorized user (`assigned_to`).

**Prevention:** Replace `findUniqueOrThrow` with `findFirst` and expand the `where` clause to enforce relationship constraints and tenancy checks: `{ id: itemId, task_id: taskId, task: { company_id: user.company_id, assigned_to: user.id } }`. Always handle the `null` case with a 404 response to avoid 500 errors.
