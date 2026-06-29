## 2023-10-27 - [Fix IDOR in multi-tenant API update/complete route]
**Vulnerability:** IDOR where users could complete tasks that belonged to another employee or another company via `frontend/src/app/api/my-tasks/[id]/complete/route.ts` because it executed an unverified `prisma.task.update`.
**Learning:** In Next.js + Prisma multi-tenant architectures, performing a mutation (`update` or `delete`) with only the resource ID is inherently vulnerable to IDOR unless ownership is verified first. Simply catching exceptions from `findFirstOrThrow` can lead to HTTP 500s.
**Prevention:** Always verify resource ownership (e.g., `assigned_to`, `company_id`) using `prisma.findFirst` returning a 404 response before executing a Prisma mutation on it.
