
## 2026-06-22 - [Fix IDOR in my-tasks checklist nested resource]
**Vulnerability:** Insecure Direct Object Reference (IDOR) on checklist item updating, allowing users to modify items for tasks not assigned to them because only the `itemId` was checked using `findUniqueOrThrow`.
**Learning:** Nested resources must validate parent ownership and hierarchy bounds. Just passing `itemId` to Prisma without checking the parent resource's ownership leaves the endpoint vulnerable to IDOR.
**Prevention:** Use `findFirst` with explicit authorization checks on both the identifier (`id`) and the relationship fields (e.g., `task: { company_id, assigned_to }`) returning a 404 response instead of using `findUniqueOrThrow` which cannot enforce these multi-field/relationship limits seamlessly.
