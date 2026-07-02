## 2024-07-02 - [Fix IDOR in my-tasks endpoints]
**Vulnerability:** IDOR in my-tasks endpoints allowing arbitrary task updates.
**Learning:** findUniqueOrThrow only checks ID, bypassing tenant isolation.
**Prevention:** Use findFirst with ownership checks and return 404.
