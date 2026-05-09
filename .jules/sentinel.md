## 2024-05-09 - [Fix Task Update/Completion IDORs]
**Vulnerability:** IDOR (Insecure Direct Object Reference) on task completion, checklist modification, and operational task updates where operations only required an ID or allowed users to manipulate resources out of scope without verifying ownership (`assigned_to` and `company_id`).
**Learning:** In a multi-tenant or role-based Next.js application using Prisma, API endpoints must explicitly verify ownership or relationship mappings within a Prisma `.findFirstOrThrow()` check *before* modifying resources using `.update()`. Merely capturing `taskId` or `itemId` is insufficient.
**Prevention:** Enforce relational bounds and tenant isolation by checking `company_id` and `assigned_to` as criteria in Prisma queries before data mutation.
