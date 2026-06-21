## 2026-06-21 - [IDOR in Nested Resource]
**Vulnerability:** IDOR where any user could update task checklist items globally via the integer ID.
**Learning:** In nested routes like tasks/taskId/items/itemId, must explicitly enforce the relationship between parent and child and verify tenant isolation (company_id).
**Prevention:** Always use findFirst to verify existence and relationship before mutations.
