## $(date +%Y-%m-%d) - [IDOR in config/areas and other endpoints]
**Vulnerability:** Prisma update and delete methods were used without verifying the company ownership of the targeted entity. In multi-tenant environments, a malicious user could exploit this to modify or delete records belonging to another company by guessing the record ID.
**Learning:** `findFirstOrThrow` is susceptible to this if only queried by `id`. When `company_id` is added, it correctly prevents cross-tenant access but causes an unhandled exception resulting in an HTTP 500 status.
**Prevention:** Always verify `company_id` ownership first using a preliminary `findFirst` check, and return a 404 JSON response instead of a 500 error, before executing Prisma `update` or `delete` methods.
