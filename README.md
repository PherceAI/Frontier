# 🏨 Frontier - Hotel Operations Platform

> "El Segundo Cerebro" del hotel - Sistema de trazabilidad operacional en tiempo real.

---

## 🎯 Descripción

Frontier es una plataforma dual para operaciones hoteleras:

- **The Tower (Admin)**: Dashboard web para gerentes - control y analytics
- **The Hands (Operativo)**: Interfaz móvil para empleados - registro de operaciones con PIN

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                                │
│                    Next.js 16 + React                        │
│                  (http://localhost:3000)                     │
├─────────────────────────────────────────────────────────────┤
│                         API                                  │
│                      Laravel 11                              │
│                  (http://localhost:8000)                     │
├─────────────────────────────────────────────────────────────┤
│                      DATABASE                                │
│                    PostgreSQL 16                             │
│                  (http://localhost:5432)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Pre-requisitos
- Docker Desktop instalado y corriendo
- Node.js 18+ (para el frontend)

### 1. Clonar e iniciar los servicios

```powershell
# Clonar el repositorio
git clone <repo-url>
cd Frontier

# Iniciar PostgreSQL + Laravel
docker compose up -d
```

### 2. Iniciar el frontend

```powershell
cd frontend
npm install
npm run dev
```

### 3. Acceder a la aplicación

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| **Frontend** | http://localhost:3000 | - |
| **API** | http://localhost:8000/api | - |
| **pgAdmin** | http://localhost:5050 | admin@frontier.local / admin |

---

## 🔐 Credenciales de Prueba

### Admin (JWT)
- **Email**: `admin@hotel.com`
- **Password**: `Admin123!`

### Empleados (PIN)
| Nombre | Área | PIN |
|--------|------|-----|
| María García | Pisos | 1234 |
| Pedro Martínez | Lavandería | 5678 |

---

## 📁 Estructura del Proyecto

```
Frontier/
├── backend-laravel/     # API Backend (Laravel + PHP)
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   ├── Models/
│   │   └── Middleware/
│   ├── routes/api.php
│   └── docker-compose.dev.yml
│
├── frontend/            # Web App (Next.js + React)
│   ├── src/
│   │   ├── app/
│   │   │   ├── tower/   # Admin interface
│   │   │   └── hands/   # Worker interface
│   │   ├── components/
│   │   └── lib/api.ts
│   └── package.json
│
├── Proyecto Arquitectura/  # Documentación
│   ├── PRD.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_SPECIFICATION.md
│   └── ...
│
├── docker-compose.yml   # Orquestación principal
└── .env                 # Variables de entorno
```

---

## 🛠️ Comandos Útiles

### Docker

```powershell
# Iniciar todo (PostgreSQL + pgAdmin + Laravel)
docker compose up -d

# Ver logs de Laravel
docker compose logs -f laravel

# Reiniciar Laravel
docker compose restart laravel

# Parar todo
docker compose down
```

### Frontend

```powershell
cd frontend

# Desarrollo
npm run dev

# Build producción
npm run build

# Lint
npm run lint
```

### Artisan (Laravel)

```powershell
# Ejecutar comandos artisan dentro del contenedor
docker compose exec laravel php artisan <comando>

# Limpiar cache
docker compose exec laravel php artisan cache:clear

# Ver rutas
docker compose exec laravel php artisan route:list
```

---

## 📊 Tech Stack

| Capa | Tecnología |
|------|------------|
| **Frontend** | Next.js 16, React 19, TanStack Query, Tailwind CSS, Shadcn/ui |
| **Backend** | Laravel 11, PHP 8.3, Eloquent ORM |
| **Database** | PostgreSQL 16 |
| **Infraestructura** | Docker, Docker Compose |

---

## 📄 Licencia

Proyecto interno - Uso exclusivo del hotel.
