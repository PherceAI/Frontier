## 2024-05-10 - Task Data IDOR Mitigation
**Vulnerability:** Several endpoints dealing with modifying Task data such as completions and checklist items lacked correct `company_id` and ownership (`assigned_to`) validations.
**Learning:** Even though users must be authenticated, omitting to check if the specific data explicitly belongs to that `company_id` allows an attacker to exploit the API structure via Insecure Direct Object Reference (IDOR) attacks modifying task statuses across tenant bounds simply by predicting the task UUID.
**Prevention:** Prisma `findFirstOrThrow` must constantly specify `{ where: { id: resourceId, company_id: auth.company_id } }` before mutating tenant data in an environment without built-in context-aware global filters.
