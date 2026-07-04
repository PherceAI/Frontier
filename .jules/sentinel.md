## 2025-02-28 - Fix IDOR in config areas
**Vulnerability:** IDOR in config area `PATCH` and `DELETE` endpoints lacking company ownership checks.
**Learning:** Using `update` without prior `findFirst` to verify `company_id` allows users to modify/delete resources of other tenants if they know the ID.
**Prevention:** Always verify `company_id` ownership with `findFirst` before executing Prisma mutations (`update`, `delete`).
