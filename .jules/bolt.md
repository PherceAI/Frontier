## 2026-02-17 - Missing Indexes on High Volume Table
**Learning:** Found `OperationalEvent` table missing indexes on foreign keys and timestamp, despite being heavily queried with filters and sorts in dashboards.
**Action:** When auditing Prisma schemas, specifically check for `@@index` on foreign keys and timestamp columns for event/log tables.
