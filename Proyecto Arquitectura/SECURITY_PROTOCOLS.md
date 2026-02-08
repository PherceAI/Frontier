# Security & Protocol Specification

> **Principle**: Defense in depth. Trust nothing, verify everything.

---

## 1. Authentication Strategy

### Dual-Layer Security Model

Frontier operates on two distinct trust levels with separate mechanisms.

```
┌─────────────────────────────────────────────────────────┐
│                    TRUST LEVELS                          │
├─────────────────────────────────────────────────────────┤
│  HIGH-TRUST (Administrative)                            │
│  ├─ Email + Password                                    │
│  ├─ JWT RS256 (Asymmetric)                              │
│  ├─ Access: 15 min / Refresh: 7 days                    │
│  └─ Scope: Configuration, Dashboard, Corrections       │
├─────────────────────────────────────────────────────────┤
│  FAST-TRUST (Operational)                               │
│  ├─ 4-Digit PIN                                         │
│  ├─ Session Token (Signed)                              │
│  ├─ Expires: 12 hours or idle 15 min                    │
│  └─ Scope: Report events in assigned areas only         │
└─────────────────────────────────────────────────────────┘
```

---

### 1.1 Administrative Authentication (JWT)

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Algorithm** | RS256 | Asymmetric; verify without secret |
| **Access Token TTL** | 15 minutes | Short-lived, minimizes damage |
| **Refresh Token TTL** | 7 days | Balance between security/UX |
| **Key Rotation** | 30 days | Automated rotation recommended |
| **Token Storage** | HttpOnly Cookie | Prevents XSS access |

**JWT Payload:**
```json
{
  "sub": "user-uuid",
  "email": "admin@hotel.com",
  "role": "OWNER",
  "companyId": "company-uuid",
  "iat": 1738770000,
  "exp": 1738770900
}
```

**Refresh Flow:**
1. Access token expires
2. Client sends refresh token to `/auth/admin/refresh`
3. Server validates refresh token (stored hash in DB)
4. New access token issued; refresh token rotated
5. Old refresh token invalidated (one-time use)

---

### 1.2 Operational Authentication (PIN Session)

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **PIN Format** | 4 digits (0000-9999) | Easy to remember, fast entry |
| **PIN Storage** | Bcrypt (cost 10) | Resistant to brute force |
| **Session TTL** | 12 hours | Covers full shift |
| **Idle Timeout** | 15 minutes | Auto-logout on inactivity |
| **Device Binding** | Optional fingerprint | Prevents token theft |

**Session Token Payload (Signed, not encrypted):**
```json
{
  "sessionId": "sess_abc123",
  "employeeId": "uuid",
  "companyId": "uuid",
  "areas": ["uuid", "uuid"],
  "iat": 1738770000,
  "exp": 1738813200
}
```

---

## 2. Brute Force Protection

### PIN Lock Policy

| Event | Action |
|-------|--------|
| 1-4 failed attempts | Log attempt, continue |
| 5th failed attempt | **LOCK for 15 minutes** |
| 10th failed attempt (after unlock) | **LOCK for 1 hour** |
| 15th failed attempt | **Permanent lock** → Manager must reset |

**Implementation:**
```typescript
// Redis key: pin_attempts:{companyId}:{pin_hash_prefix}
{
  "attempts": 5,
  "lockedUntil": "2026-02-05T15:10:00Z",
  "lastAttempt": "2026-02-05T14:55:00Z"
}
```

### Admin Login Protection

| Event | Action |
|-------|--------|
| 5 failed attempts | Lock for 15 minutes |
| Account locked 3 times in 24h | Email notification to OWNER |

---

## 3. Authorization (RBAC)

### Role Hierarchy

```
OWNER
  └─ MANAGER
       └─ EMPLOYEE (PIN users)
```

### Permission Matrix

| Resource | OWNER | MANAGER | EMPLOYEE |
|----------|-------|---------|----------|
| View Dashboard | ✅ | ✅ | ❌ |
| Create Employee | ✅ | ✅ | ❌ |
| Reset PIN | ✅ | ❌ | ❌ |
| Delete Employee | ✅ | ❌ | ❌ |
| Create Area | ✅ | ✅ | ❌ |
| Delete Area | ✅ | ❌ | ❌ |
| Record Event | ❌ | ❌ | ✅ (own areas) |
| Create Correction | ✅ | ✅ | ❌ |
| View Audit Logs | ✅ | ❌ | ❌ |

### Area-Based Access Control

Employees can ONLY:
- View items relevant to their assigned areas
- Record events in their assigned areas
- See pending work for their areas

```typescript
// Guard validation
if (!employee.areas.includes(request.areaId)) {
  throw new ForbiddenException('Not assigned to this area');
}
```

---

## 4. Immutability Protocol (The Ledger)

### Write-Only Policy

The `operational_events` table is the **legal truth** of hotel operations.

| Action | Allowed | Mechanism |
|--------|---------|-----------|
| INSERT | ✅ | Normal operation |
| UPDATE | ❌ | Database trigger blocks |
| DELETE | ❌ | Database trigger blocks |

**PostgreSQL Trigger:**
```sql
CREATE OR REPLACE FUNCTION prevent_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Ledger is immutable. Use CORRECTION events instead.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ledger_immutable
BEFORE UPDATE OR DELETE ON operational_events
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();
```

### Correction Protocol

Mistakes are fixed via **compensating transactions**, not edits:

```
Original: +10 Towels (DEMAND) by María at 14:55
Error:    María actually collected 7, not 10

Correction: -3 Towels (CORRECTION) by Manager at 15:10
            Linked to original event ID
            Reason: "Conteo incorrecto"
```

---

## 5. Data Protection

### Personal Data Isolation

| Data Type | Table | Protection |
|-----------|-------|------------|
| Manager Email | `users` | Encrypted at rest |
| Employee Name | `employees` | Company-scoped |
| Event Data | `operational_events` | Anonymizable |

### Data Retention

| Data Type | Retention | Rationale |
|-----------|-----------|-----------|
| Operational Events | 2 years | Legal compliance |
| Audit Logs | 5 years | Financial audit |
| Session Data | 30 days | Troubleshooting |
| Deleted Employees | 90 days | Recovery window |

### GDPR Compliance

- **Right to Access**: Export endpoint for employee data
- **Right to Erasure**: Anonymization of employee references in ledger
- **Data Portability**: JSON export of all company data

---

## 6. Input Validation

### Global Validation Pipeline

All inputs validated before processing using **Laravel Form Requests**:

```php
// StoreEmployeeRequest.php
public function rules(): array
{
    return [
        'full_name' => ['required', 'string', 'min:2', 'max:100'],
        'employee_code' => ['required', 'regex:/^[A-Z]{3}-\d{3}$/'],
        'area_ids' => ['required', 'array', 'min:1'],
        'area_ids.*' => ['uuid', 'exists:operational_areas,id'],
    ];
}
```

### SQL Injection Prevention

- ✅ Eloquent ORM with PDO binding
- ✅ No raw SQL interpolation
- ✅ Input sanitization on all string fields

### XSS Prevention

- ✅ Output encoding in API responses
- ✅ Content-Security-Policy header
- ✅ No user-generated HTML rendering

---

## 7. Network Security

### CORS Policy

```php
// config/cors.php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['https://admin.frontier.hotel', 'https://app.frontier.hotel'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

### Security Headers

| Header | Value |
|--------|-------|
| `Strict-Transport-Security` | max-age=31536000; includeSubDomains |
| `X-Content-Type-Options` | nosniff |
| `X-Frame-Options` | DENY |
| `X-XSS-Protection` | 1; mode=block |
| `Content-Security-Policy` | default-src 'self' |
| `Referrer-Policy` | strict-origin-when-cross-origin |

### TLS Requirements

- Minimum TLS 1.2 (prefer 1.3)
- Strong cipher suites only
- HSTS preloading recommended

---

## 8. Audit Logging

### Auditable Actions

| Category | Actions Logged |
|----------|---------------|
| **Auth** | Login success/failure, logout, PIN reset |
| **Config** | Create/Update/Delete any entity |
| **Corrections** | All correction events with reason |
| **Access** | Sensitive data exports |

### Audit Log Format

```json
{
  "id": "uuid",
  "timestamp": "2026-02-05T15:00:00Z",
  "actor": {
    "type": "USER",
    "id": "uuid",
    "email": "admin@hotel.com"
  },
  "action": "PIN_RESET",
  "resource": {
    "type": "employee",
    "id": "uuid"
  },
  "metadata": {
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "reason": "Employee forgot PIN"
  }
}
```

---

## 9. Operational Continuity

### Offline Mode (V2 Roadmap)

| Feature | Implementation |
|---------|---------------|
| PWA Cache | IndexedDB event queue |
| Sync Strategy | FIFO on reconnect |
| Conflict Resolution | Server timestamp wins |
| Max Queue Size | 100 events |

### Graceful Degradation

| Failure | Behavior |
|---------|----------|
| Database down | Read from cache, queue writes |
| Auth service down | Extend existing tokens |
| Network timeout | Retry with exponential backoff |

---

## 10. Security Checklist (Pre-Deploy)

- [ ] All secrets in environment variables
- [ ] Database credentials rotated
- [ ] JWT keys generated (RS256)
- [ ] Rate limiting configured
- [ ] CORS restricted to production domains
- [ ] TLS certificate valid
- [ ] Audit logging enabled
- [ ] Backup strategy verified
- [ ] Penetration test completed
