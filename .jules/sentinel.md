## 2024-05-03 - Missing Tenant Isolation and Parent Relationship Checks in Nested Prisma Resources
**Vulnerability:** IDOR (Insecure Direct Object Reference) vulnerabilities were found in task and checklist endpoints (`/api/operations/tasks/[taskId]`, `/api/operations/tasks/[taskId]/items/[itemId]`, and `/api/my-tasks/[id]/checklist/[itemId]`). Specifically, nested resources (like `taskChecklistItem`) were being queried or updated using `findUniqueOrThrow` or simple `update` statements based solely on the child resource ID (e.g., `itemId`), without enforcing the parent relationship (`task_id`) or tenant isolation (`company_id`).

**Learning:** When dealing with multi-tenant applications using Prisma, it is not sufficient to rely on authentication middleware alone. Direct database queries on nested resources must explicitly include relational constraints in their `where` clauses to prevent users from accessing or modifying items that belong to other tasks or companies. The use of `findUniqueOrThrow` based only on the primary key makes it easy to overlook these contextual checks.

**Prevention:** Always use `findFirstOrThrow` (or `findFirst` with a subsequent null check) instead of `findUniqueOrThrow` for nested resources, allowing the inclusion of relational checks. Ensure every query filtering a resource includes:
1.  The specific item ID.
2.  The parent relationship ID (e.g., `task_id`).
3.  The tenant isolation ID (e.g., `company_id`), typically accessed via relation if not present directly on the child model (e.g., `task: { company_id: auth.employee.company_id }`).
4.  Ownership verification if applicable (e.g., `task: { assigned_to: auth.employee.id }`).
