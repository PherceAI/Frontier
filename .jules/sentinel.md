## 2026-03-10 - [IDOR in Multi-tenant Endpoints]
**Vulnerability:** IDOR vulnerability where an employee could modify any task or checklist item simply by providing its ID.
**Learning:** In multi-tenant systems, direct object reference without ownership/tenant verification bypasses authorization completely. Relying only on findUnique with ID is insufficient when the resource isn't globally isolated.
**Prevention:** Always verify company_id and assigned_to context using findFirstOrThrow when accessing resources like tasks or checklist items, instead of querying solely by resource ID.
