## 2025-06-08 - Fix IDOR in Task Templates

**Vulnerability:** In `frontend/src/app/api/task-templates/[id]/route.ts`, the `PATCH` and `DELETE` endpoints were vulnerable to Insecure Direct Object Reference (IDOR). They executed Prisma `update` operations using only the `id` from the URL parameters, without enforcing tenant isolation by checking if the template belonged to the authenticated user's `company_id`.

**Learning:** When using Prisma, the `update` and `delete` methods require unique identifiers in their `where` clause. Because `company_id` is not unique on its own, it cannot be included directly in `where` along with `id` without causing type errors or schema changes. Consequently, tenant isolation checks must be explicitly performed before mutating the data.

**Prevention:** Always perform a preliminary authorization query (e.g., `prisma.taskTemplate.findFirst({ where: { id, company_id } })`) and return a 404 response if the entity is not found or does not belong to the user's tenant before executing `update` or `delete` operations.
