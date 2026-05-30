## 2025-05-30 - Fix IDOR in Operational Areas config
**Vulnerability:** IDOR vulnerability in operational area PATCH and DELETE operations due to missing `company_id` validation. An attacker could modify or delete operational areas belonging to other companies by supplying an arbitrary area ID.
**Learning:** Prisma's `update` and `delete` methods require unique identifiers in the `where` clause, making it easy to forget tenant isolation.
**Prevention:** Always use `prisma.findFirstOrThrow` with the `company_id` filter to authorize the resource ownership before executing mutations that only accept unique IDs.
