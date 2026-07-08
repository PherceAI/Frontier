
## 2024-07-08 - Fix Insecure Direct Object Reference (IDOR) on /api/my-tasks/[id]/complete
**Vulnerability:** Employees could complete tasks that belonged to other employees because the `/api/my-tasks/[id]/complete` endpoint did not verify `assigned_to` ownership before running `prisma.task.update`.
**Learning:** For endpoints acting on user-specific resources based only on a URL parameter `[id]`, validating the session is not sufficient. A user could send a request with a valid ID belonging to another user.
**Prevention:** Always perform a preliminary `prisma.findFirst` check combining the resource `id` and the user's `id` (e.g., `assigned_to: auth.employee.id`). If it returns null, return a 404 response. Do not use `findUniqueOrThrow` to avoid causing unhandled exceptions (HTTP 500) if the resource does not exist or doesn't belong to the user.
