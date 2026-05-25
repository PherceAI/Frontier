## 2026-05-25 - [HIGH] Fix IDOR in task checklist item update
**Vulnerability:** IDOR in `frontend/src/app/api/my-tasks/[id]/checklist/[itemId]/route.ts` where any employee could update any checklist item from any task, regardless of task ownership or company, just by guessing the `itemId`.
**Learning:** Using `findUniqueOrThrow` with only the primary key (`id`) fails to enforce relationship bounds (like `task_id`) or tenant isolation (`company_id`, `assigned_to`), allowing unauthorized access to nested resources.
**Prevention:** Replace `findUniqueOrThrow` with `findFirstOrThrow` to allow adding non-unique constraints (e.g., parent relationship `task_id` and ownership checks `company_id`, `assigned_to`) to the `where` clause to enforce proper isolation.
