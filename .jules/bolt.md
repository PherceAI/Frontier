## 2026-02-17 - Missing Indexes on High Volume Table
**Learning:** Found `OperationalEvent` table missing indexes on foreign keys and timestamp, despite being heavily queried with filters and sorts in dashboards.
**Action:** When auditing Prisma schemas, specifically check for `@@index` on foreign keys and timestamp columns for event/log tables.
## 2026-02-17 - Slow Sequential PIN Login
**Learning:** Found `api/auth/pin/login` iterating sequentially through all employees with bcrypt, which is very slow ((N)$). Also missing tenant isolation (fetches all active employees).
**Action:** Replaced sequential loop with `Promise.all` for parallel verification and added support for optional `companyId` to filter the search in future.
