## 2026-05-24 - IDOR Vulnerabilities in Prisma findUniqueOrThrow queries
**Vulnerability:** Prisma's `findUnique` and `findUniqueOrThrow` enforce querying only by unique constraints (e.g., just the resource ID). This led to IDOR vulnerabilities in endpoints updating resources, as developers omitted tenant boundaries (`company_id`, `assigned_to`) from the authorization check.
**Learning:** In a multi-tenant application, relying exclusively on primary keys for updates or deletes breaks tenant isolation.
**Prevention:** Always use `findFirstOrThrow` rather than `findUniqueOrThrow` when enforcing relationship bounds (e.g., scoping the query to the authenticated `company_id` or `employee.id`), or check permissions separately before mutation.
