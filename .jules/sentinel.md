## 2024-05-24 - IDOR in nested Task Checklist Item Update
**Vulnerability:** IDOR in `/api/my-tasks/[id]/checklist/[itemId]` allowing users to update checklist items that do not belong to their assigned task or company.
**Learning:** `findUniqueOrThrow` with only the `id` of the nested resource was used, without validating the parent relationship or the user's authorization to modify it.
**Prevention:** Always verify parent relationship and authorization context using `findFirst` when accessing nested resources before executing an update, instead of solely querying by the resource ID.
