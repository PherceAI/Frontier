
## 2024-10-24 - [Fix IDOR in Operational Area update/delete]
**Vulnerability:** Insecure Direct Object Reference (IDOR) on `/api/config/areas/[id]`. The PATCH and DELETE endpoints allowed users to modify or disable operational areas belonging to other companies.
**Learning:** Using `prisma.update` directly with only the ID parameter doesn't automatically enforce tenant isolation. A malicious user could send requests with IDs belonging to other tenants to alter their configurations.
**Prevention:** Always verify tenant ownership (e.g., using a `prisma.findFirst` query with the `company_id` filter) before performing updates or deletes, and return a 404 Not Found if the check fails to prevent IDOR vulnerabilities.
