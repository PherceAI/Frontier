## 2024-06-18 - Missing IDOR prevention in Task endpoints
**Vulnerability:** Employees could access and modify tasks belonging to other companies by supplying a different task ID, as `findFirstOrThrow` did not check the `company_id`.
**Learning:** Always verify multi-tenant isolation even in nested or operational routes. Checking existence with an ID is not enough if the ownership (`company_id`) isn't also verified.
**Prevention:** Use `findFirst` to simultaneously check for resource ID and `company_id`. Return a 404 response to avoid unhandled exceptions causing HTTP 500 errors and avoid leaking resource existence.
