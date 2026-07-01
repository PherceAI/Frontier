## 2024-07-01 - Fix IDOR in Task Templates Configuration
**Vulnerability:** IDOR in task templates configuration API where admins could modify or delete templates from other companies because the `PATCH` and `DELETE` endpoints only used the `id` to update the template without checking `company_id`.
**Learning:** When mutating entities in a multi-tenant application, it's critical to first verify ownership using a preliminary `findFirst` check with the `company_id` filter before executing Prisma `update` or `delete` methods, returning a 404 response if not found.
**Prevention:** Always verify `company_id` ownership first using a preliminary `findFirst` check before executing Prisma `update` or `delete` methods.
