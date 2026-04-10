
## 2024-04-10 - [HIGH] Fix IDOR in nested task checklist endpoints
**Vulnerability:** IDOR (Insecure Direct Object Reference) in `my-tasks/[id]/checklist/[itemId]` and `operations/tasks/[taskId]/items/[itemId]`. The endpoints were only looking up the `TaskChecklistItem` by its primary key (`itemId`), failing to verify that the item actually belonged to the `Task` specified in the URL path, or that the task belonged to the authenticated user's company and was assigned to them.
**Learning:** For nested resources (e.g., `parent/:parentId/child/:childId`), querying only the child's primary key bypasses authorization if an attacker passes a valid `childId` belonging to another tenant/user.
**Prevention:** Always use Prisma relational queries (e.g., `findFirstOrThrow` checking the `task` relationship) to strictly enforce the parent-child hierarchy and tenant ownership constraints.
