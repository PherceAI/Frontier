## 2026-05-20 - Nested Resource IDOR
**Vulnerability:** Insecure Direct Object Reference (IDOR) on `/api/my-tasks/[id]/checklist/[itemId]` update. Used `findUniqueOrThrow` solely by `itemId` without validating ownership.
**Learning:** When fetching nested resources, validating the parent route parameter (`id`) is crucial but not enough; the child entity query MUST enforce the relationship to the validated parent (e.g., `where: { id: itemId, task_id: id }`).
**Prevention:** Avoid `findUniqueOrThrow` when enforcing tenant (`company_id`) or relationship boundaries. Always use `findFirstOrThrow` and include the parent ID and/or tenant ID in the `where` clause to prevent unauthorized modification across boundaries.
