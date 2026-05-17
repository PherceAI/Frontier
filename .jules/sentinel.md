## 2024-05-17 - Fix IDOR in task endpoints
**Vulnerability:** IDOR in task endpoints where update calls were missing company_id or assigned_to validation.
**Learning:** Using findUnique and update without verifying relationships can lead to tenant isolation breaches.
**Prevention:** Always validate ownership/relationships using findFirstOrThrow with company_id/assigned_to before executing mutations.
