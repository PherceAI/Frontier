
## 2024-05-16 - Prevent IDOR in Nested Resources
**Vulnerability:** The `my-tasks/[id]/checklist/[itemId]` endpoint updated checklist items solely by the provided `itemId`, without validating if the parent `id` belonged to the authenticated employee's company and assigned tasks. This could allow an attacker to bypass authorization and modify checklist items belonging to other tenants/users (Insecure Direct Object Reference).
**Learning:** In nested routes, we cannot rely on just finding the child object by ID. We must explicitly enforce the authorization context (e.g., `company_id` and `assigned_to` of the parent `Task`) within the Prisma query.
**Prevention:** Use `prisma.findFirstOrThrow` with a query that traverses relationships. For example, when fetching a `taskChecklistItem`, include `task: { assigned_to: auth.employee.id, company_id: auth.employee.company_id }` in the `where` clause to securely scope the query to authorized boundaries.
