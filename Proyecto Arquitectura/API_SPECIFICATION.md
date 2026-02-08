# API Specification & Contracts

> **Framework**: Laravel 12 | **Style**: REST | **Validation**: FormRequests | **Docs**: OpenAPI 3.0 (Scribe/Swagger)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     API Gateway                          │
│  Rate Limit │ CORS │ Middleware │ Request Logging        │
├─────────────────────────────────────────────────────────┤
│  /auth/*    │  /config/*   │  /ops/*   │  /dashboard/*  │
│  JWT/PIN    │  CRUD Admin  │  Events   │  Analytics     │
├─────────────────────────────────────────────────────────┤
│                   Service Layer                          │
│         Business Logic + Validation (FormRequests)      │
├─────────────────────────────────────────────────────────┤
│                   Data Layer (Eloquent)                  │
│                     PostgreSQL                           │
└─────────────────────────────────────────────────────────┘
```

---

## Response Envelope (Standard)

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-02-05T14:55:00Z",
    "requestId": "req_abc123"
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "meta": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Email or password is incorrect",
    "details": null
  },
  "meta": { ... }
}
```

---

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Wrong email/password or PIN |
| `AUTH_TOKEN_EXPIRED` | 401 | JWT or session expired |
| `AUTH_PIN_LOCKED` | 423 | Too many PIN attempts |
| `AUTH_INSUFFICIENT_ROLE` | 403 | Action requires higher role |
| `VALIDATION_FAILED` | 422 | Form Validation error |
| `RESOURCE_NOT_FOUND` | 404 | Entity doesn't exist |
| `RESOURCE_CONFLICT` | 409 | Duplicate or constraint violation |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 1. Authentication Module (`/auth`)

### POST `/auth/admin/login`
Admin login with email/password.

| Attribute | Value |
|-----------|-------|
| **Guard** | RateLimit(5/min) |
| **Auth** | Public |

**Request:**
```json
{
  "email": "admin@hotel.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "expiresIn": 900,
    "user": {
      "id": "uuid",
      "email": "admin@hotel.com",
      "fullName": "Juan Director",
      "role": "OWNER",
      "companyId": "uuid"
    }
  }
}
```

---

### POST `/auth/admin/refresh`
Refresh access token.

| Attribute | Value |
|-----------|-------|
| **Auth** | Refresh Token (Body) |

**Request:**
```json
{
  "refreshToken": "eyJhbG..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...",
    "expiresIn": 900
  }
}
```

---

### POST `/auth/admin/logout`
Invalidate refresh token.

| Attribute | Value |
|-----------|-------|
| **Auth** | Bearer JWT |

**Response (200):**
```json
{
  "success": true,
  "data": { "message": "Logged out successfully" }
}
```

---

### GET `/auth/admin/me`
Get current admin profile.

| Attribute | Value |
|-----------|-------|
| **Auth** | Bearer JWT |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@hotel.com",
    "fullName": "Juan Director",
    "role": "OWNER",
    "company": {
      "id": "uuid",
      "name": "Hotel Paraíso",
      "code": "HP01"
    }
  }
}
```

---

### POST `/auth/pin/login`
Employee login with 4-digit PIN.

| Attribute | Value |
|-----------|-------|
| **Guard** | RateLimit(10/min), BruteForce(5 attempts → 15min lockout) |
| **Auth** | Public |

**Request:**
```json
{
  "pin": "4829"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "sessionToken": "sess_abc123...",
    "expiresAt": "2026-02-06T02:55:00Z",
    "employee": {
      "id": "uuid",
      "fullName": "María García",
      "areas": [
        { "id": "uuid", "name": "Pisos", "type": "SOURCE" }
      ]
    }
  }
}
```

**Response (423 - Locked):**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_PIN_LOCKED",
    "message": "Too many attempts. Try again in 15 minutes.",
    "details": { "unlocksAt": "2026-02-05T15:10:00Z" }
  }
}
```

---

### POST `/auth/pin/logout`
End employee session.

| Attribute | Value |
|-----------|-------|
| **Auth** | x-session-token |

**Response (200):**
```json
{
  "success": true,
  "data": { "message": "Session ended" }
}
```

---

## 2. Configuration Module (`/config`)

> All endpoints require **Bearer JWT** with role `OWNER` or `MANAGER`.

---

### Employees CRUD

#### GET `/config/employees`
List employees with pagination.

**Query:** `?page=1&limit=20&search=maria&isActive=true`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "fullName": "María García",
      "employeeCode": "EMP-001",
      "isActive": true,
      "areas": [
        { "id": "uuid", "name": "Pisos" }
      ],
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 45 }
}
```

#### POST `/config/employees`
Create new employee (auto-generates PIN).

**Request:**
```json
{
  "fullName": "Pedro López",
  "employeeCode": "EMP-002",
  "areaIds": ["uuid", "uuid"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fullName": "Pedro López",
    "employeeCode": "EMP-002",
    "generatedPin": "7293",
    "areas": [ ... ]
  }
}
```

> ⚠️ `generatedPin` is shown ONLY on creation. Store/print immediately.

#### GET `/config/employees/:id`
Get single employee details.

#### PATCH `/config/employees/:id`
Update employee (name, areas, active status).

#### POST `/config/employees/:id/reset-pin`
Generate new PIN (OWNER only).

**Response (200):**
```json
{
  "success": true,
  "data": { "newPin": "5182" }
}
```

#### DELETE `/config/employees/:id`
Soft-delete employee (sets isActive=false).

---

### Areas CRUD

#### GET `/config/areas`
**Query:** `?type=SOURCE&isActive=true`

#### POST `/config/areas`
```json
{
  "name": "Piso 3",
  "type": "SOURCE",
  "description": "Habitaciones 301-320"
}
```

#### GET `/config/areas/:id`
#### PATCH `/config/areas/:id`
#### DELETE `/config/areas/:id`

---

### Catalog Items CRUD

#### GET `/config/items`
**Query:** `?category=Lencería&isActive=true`

#### POST `/config/items`
```json
{
  "name": "Toalla Mediana",
  "category": "Lencería",
  "iconRef": "towel-md",
  "unit": "piece"
}
```

#### GET `/config/items/:id`
#### PATCH `/config/items/:id`
#### DELETE `/config/items/:id`

---

## 3. Operations Module (`/ops`)

> Operational endpoints use **x-session-token** header (PIN sessions).

---

### POST `/ops/events`
Record operational event (The "One-Tap" Action).

| Attribute | Value |
|-----------|-------|
| **Auth** | x-session-token |
| **Validation** | Employee must be assigned to area |

**Request:**
```json
{
  "areaId": "uuid",
  "eventType": "DEMAND",
  "items": [
    { "itemId": "uuid", "quantity": 3 },
    { "itemId": "uuid", "quantity": 5 }
  ],
  "notes": null
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "eventId": "uuid",
    "timestamp": "2026-02-05T14:55:00.123Z",
    "employee": "María García",
    "area": "Piso 2",
    "eventType": "DEMAND",
    "totalItems": 8
  }
}
```

**Side Effects:**
- Emits SSE event to `/dashboard/stream` for real-time updates
- Updates aggregated counters in cache

---

### GET `/ops/events`
Get event history (employee's own events).

| Attribute | Value |
|-----------|-------|
| **Auth** | x-session-token |

**Query:** `?limit=50&since=2026-02-05T00:00:00Z`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "timestamp": "2026-02-05T14:55:00Z",
      "area": "Piso 2",
      "eventType": "DEMAND",
      "items": [
        { "name": "Toalla Grande", "quantity": 3 }
      ]
    }
  ]
}
```

---

### GET `/ops/pending`
Get pending work for employee's assigned areas.

| Attribute | Value |
|-----------|-------|
| **Auth** | x-session-token |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalPending": 150,
    "byItem": [
      { "name": "Toalla Grande", "icon": "towel-lg", "pending": 45 },
      { "name": "Sábana King", "icon": "sheet-king", "pending": 105 }
    ],
    "message": "Tienes 150 piezas pendientes"
  }
}
```

---

### POST `/ops/corrections`
Manager-authorized correction (JWT required).

| Attribute | Value |
|-----------|-------|
| **Auth** | Bearer JWT (OWNER, MANAGER) |

**Request:**
```json
{
  "originalEventId": "uuid",
  "areaId": "uuid",
  "items": [
    { "itemId": "uuid", "quantity": -10 }
  ],
  "reason": "Conteo incorrecto reportado por María"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "correctionEventId": "uuid",
    "originalEventId": "uuid",
    "adjustedBy": "Juan Director",
    "timestamp": "2026-02-05T15:00:00Z"
  }
}
```

---

## 4. Dashboard Module (`/dashboard`)

> All endpoints require **Bearer JWT**.

---

### GET `/dashboard/bottleneck`
The "God View" - Supply vs Demand in real-time.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalDemand": 500,
      "totalSupply": 320,
      "pendingRatio": 0.36,
      "status": "WARNING"
    },
    "byArea": [
      {
        "areaId": "uuid",
        "areaName": "Piso 2",
        "demand": 150,
        "supply": 0,
        "pending": 150,
        "status": "CRITICAL"
      }
    ],
    "alerts": [
      {
        "area": "Piso 2",
        "level": "CRITICAL",
        "message": "150 items sin procesar desde hace 4 horas"
      }
    ]
  }
}
```

**Status Levels:**
- `OK`: pending < 20%
- `WARNING`: pending 20-50%
- `CRITICAL`: pending > 50%

---

### GET `/dashboard/activities`
Live feed of recent events.

**Query:** `?limit=50&areaId=uuid&eventType=DEMAND`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "timestamp": "2026-02-05T14:55:00Z",
      "employee": "María García",
      "area": "Piso 2",
      "eventType": "DEMAND",
      "totalItems": 8,
      "items": [
        { "name": "Toalla Grande", "quantity": 3 },
        { "name": "Sábana King", "quantity": 5 }
      ]
    }
  ]
}
```

---

### GET `/dashboard/stream`
Server-Sent Events for real-time updates.

| Attribute | Value |
|-----------|-------|
| **Auth** | Bearer JWT (query param: `?token=...`) |
| **Content-Type** | text/event-stream |

**Events:**
```
event: NEW_EVENT
data: {"eventId":"uuid","area":"Piso 2","type":"DEMAND","count":8}

event: BOTTLENECK_UPDATE
data: {"pendingRatio":0.42,"status":"WARNING"}
```

---

### GET `/dashboard/employee/:id/stats`
Individual employee performance.

**Query:** `?from=2026-02-01&to=2026-02-05`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "employee": {
      "id": "uuid",
      "fullName": "María García"
    },
    "period": { "from": "2026-02-01", "to": "2026-02-05" },
    "stats": {
      "totalEvents": 48,
      "totalItems": 520,
      "avgItemsPerEvent": 10.8,
      "byDay": [
        { "date": "2026-02-01", "events": 12, "items": 130 }
      ]
    }
  }
}
```

---

### GET `/dashboard/area/:id/stats`
Area performance metrics.

**Query:** `?from=2026-02-01&to=2026-02-05`

---

## 5. Rate Limiting

| Endpoint Pattern | Limit | Window |
|------------------|-------|--------|
| `/auth/admin/login` | 5 | 1 min |
| `/auth/pin/login` | 10 | 1 min |
| `/ops/*` | 100 | 1 min |
| `/dashboard/*` | 60 | 1 min |
| `/config/*` | 30 | 1 min |

---

## 6. Security Headers

All responses include:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

---

## 7. OpenAPI Schema Location

```
GET /api/docs      → Swagger UI
GET /api/docs.json → OpenAPI 3.1 JSON
GET /api/docs.yaml → OpenAPI 3.1 YAML
```
