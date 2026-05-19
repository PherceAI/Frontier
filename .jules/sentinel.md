
## 2024-05-19 - Fix Insecure Direct Object Reference in Task Checklists and Tasks
**Vulnerability:** Insecure Direct Object Reference (IDOR) on nested operational resources (`my-tasks/[id]/checklist/[itemId]/route.ts` and `operations/tasks/[taskId]/route.ts`).
**Learning:** Next.js API routes were previously querying and modifying data solely by the resource's primary key (`id` / `itemId`) with `findUniqueOrThrow`. This allowed an authenticated user from any tenant to update task and checklist item statuses belonging to other companies by enumerating UUIDs or database IDs.
**Prevention:** Always enforce tenant-isolation (`company_id`) and relationship validation (`assigned_to`) in authorization checks before updates. In Prisma, this often requires switching `findUniqueOrThrow` to `findFirstOrThrow` to add relational validation clauses directly to the query.
