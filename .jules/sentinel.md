## 2025-02-28 - [IDOR in config/areas endpoints]
**Vulnerability:** Insecure Direct Object Reference (IDOR) on PATCH and DELETE config/areas endpoints. The routes updated Prisma elements purely by `id` without enforcing tenant isolation via `company_id`.
**Learning:** `findFirstOrThrow` is necessary before mutating objects when `company_id` needs to be scoped in addition to a primary key because Prisma `update` doesn't enforce relationships in its `where` clause if they're not part of a unique index.
**Prevention:** Always scope resource manipulations directly using `findFirstOrThrow` querying both `id` and `company_id` to enforce tenant isolation.
