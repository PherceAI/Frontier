# 🚀 Frontier Laravel Backend

Backend Laravel dockerizado que reemplaza al backend NestJS. **100% Docker - No necesitas instalar nada**.

## 📋 Pre-requisitos

- ✅ Docker Desktop instalado y corriendo
- ✅ Base de datos PostgreSQL existente (del proyecto anterior)

---

## 🏃 Quick Start

### Paso 1: Asegúrate que PostgreSQL está corriendo

```powershell
# Desde la carpeta raíz del proyecto (Frontier/)
docker compose up -d postgres
```

### Paso 2: Inicia Laravel

```powershell
# Desde esta carpeta (backend-laravel/)
docker compose -f docker-compose.dev.yml up --build
```

### Paso 3: Verifica que funciona

```powershell
# En otra terminal:
curl http://localhost:8000/api/health
```

Deberías ver:
```json
{"success":true,"data":{"status":"ok","timestamp":"...","service":"frontier-laravel"}}
```

---

## 🔌 Endpoints Implementados

### Auth (`/api/auth`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/admin/login` | Login admin (email/password) |
| POST | `/auth/admin/refresh` | Refresh JWT token |
| GET | `/auth/admin/me` | Perfil del admin |
| POST | `/auth/pin/login` | Login empleado (PIN) |
| POST | `/auth/pin/logout` | Logout empleado |

### Config (`/api/config`) - Requiere JWT
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/config/employees` | Listar empleados |
| POST | `/config/employees` | Crear empleado |
| GET | `/config/employees/{id}` | Ver empleado |
| PATCH | `/config/employees/{id}` | Actualizar empleado |
| DELETE | `/config/employees/{id}` | Desactivar empleado |
| POST | `/config/employees/{id}/reset-pin` | Resetear PIN |
| GET | `/config/areas` | Listar áreas |
| POST | `/config/areas` | Crear área |
| GET | `/config/items` | Listar items |
| POST | `/config/items` | Crear item |

### Ops (`/api/ops`) - Requiere Session Token
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/ops/events` | Registrar evento |
| GET | `/ops/events` | Historial de eventos |
| GET | `/ops/pending` | Trabajo pendiente |

### Dashboard (`/api/dashboard`) - Requiere JWT
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/dashboard/bottleneck` | Vista de cuellos de botella |
| GET | `/dashboard/activities` | Feed de actividades |
| GET | `/dashboard/employee/{id}/stats` | Stats de empleado |

---

## 🔧 Comandos Útiles

```powershell
# Ver logs
docker compose -f docker-compose.dev.yml logs -f laravel

# Ejecutar comandos artisan
docker compose -f docker-compose.dev.yml exec laravel php artisan <comando>

# Reiniciar Laravel
docker compose -f docker-compose.dev.yml restart laravel

# Parar todo
docker compose -f docker-compose.dev.yml down
```

---

## 🔄 Migrar el Frontend

El frontend solo necesita cambiar la URL de la API:

```typescript
// frontend/src/lib/api.ts
// Cambiar de:
const API_URL = 'http://localhost:3001';  // NestJS

// A:
const API_URL = 'http://localhost:8000/api';  // Laravel
```

---

## 📁 Estructura del Proyecto

```
backend-laravel/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/    ← Controladores API
│   │   │   ├── ApiController.php
│   │   │   ├── AuthController.php
│   │   │   ├── EmployeesController.php
│   │   │   ├── AreasController.php
│   │   │   ├── ItemsController.php
│   │   │   ├── OpsController.php
│   │   │   └── DashboardController.php
│   │   └── Middleware/
│   │       ├── JwtAuth.php     ← Middleware JWT
│   │       └── SessionAuth.php ← Middleware PIN
│   └── Models/                  ← Modelos Eloquent
│       ├── Company.php
│       ├── User.php
│       ├── Employee.php
│       ├── OperationalArea.php
│       ├── CatalogItem.php
│       ├── OperationalEvent.php
│       ├── EventDetail.php
│       └── EmployeeSession.php
├── routes/
│   └── api.php                  ← Rutas de la API
├── config/
│   └── cors.php                 ← Configuración CORS
├── docker-compose.dev.yml       ← Docker Compose
├── Dockerfile.dev               ← Imagen Docker
└── .env                         ← Variables de entorno
```

---

## 🔐 Credenciales de Prueba

Las mismas que usabas con NestJS:

- **Admin**: `admin@hotel.com` / `Admin123!`
- **Empleados PINs**: María=1234, Pedro=5678, Ana=9012

---

## ⚠️ Notas Importantes

1. **La base de datos es la misma** - Laravel usa las tablas existentes de PostgreSQL
2. **Los responses son compatibles** - Mismo formato JSON que NestJS
3. **Los endpoints son iguales** - Solo cambia el puerto (3001 → 8000) y el prefijo `/api`
