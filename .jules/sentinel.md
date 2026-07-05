## 2024-07-05 - Fix IDOR in nested checklist item endpoint
**Vulnerability:** The my-tasks checklist endpoint allowed IDOR because it fetched the checklist item by ID without checking if it belonged to the specified task, or if the task belonged to the user's company and was assigned to the user.
**Learning:** Nested resources must validate relationships to their parents, and authorization checks must be enforced along the relationship chain. Using findUniqueOrThrow with only the primary key bypasses relationship checks.
**Prevention:** Use findFirst to enforce relationship bounds and tenant isolation (e.g., verifying company_id and assigned_to on the parent task) and return a 404 response.
