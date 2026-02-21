# 🏨 Frontier - Hotel Operations Platform

> "El Segundo Cerebro" del hotel - Sistema de trazabilidad operacional en tiempo real.

---

## 🎯 Descripción

Frontier es una plataforma dual para operaciones hoteleras:

- **The Tower (Admin)**: Dashboard web para gerentes - control y analytics
- **The Hands (Operativo)**: Interfaz móvil para empleados - registro de operaciones con PIN

---

## 🏗️ Arquitectura (Next.js Full-Stack)

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND & API                          │
│                    Next.js 16 + React                        │
│                  (http://localhost:3000)                     │
├─────────────────────────────────────────────────────────────┤
│                      DATABASE                                │
│                    PostgreSQL 16                             │
│                  (http://localhost:5432)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (Automático)

### Windows

Ejecuta el script de inicio limpio. Esto levantará Docker para la base de datos, instalará dependencias, migrará el esquema y arrancará el proyecto completo.

```powershell
.\start_dev.cmd
```

### Manual

Si prefieres paso a paso:

1. **Base de Datos (Docker)**
   ```powershell
   docker compose up -d postgres pgadmin
   ```

2. **Frontend (Next.js Full-Stack)**
   ```powershell
   cd frontend
   npm install
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

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
| Ana Martínez | Mantenimiento | 9012 |

---

## 📁 Estructura del Proyecto

```
Frontier/
├── frontend/            # Web App (Next.js App Router for UI & APIs)
│   ├── prisma/          # Database ORM schema
│   │   └── schema.prisma
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/     # Backend Routes
│   │   │   ├── tower/   # Admin interface
│   │   │   └── hands/   # Worker interface
│   │   ├── components/
│   │   └── lib/         # Shared helpers and server DB setup
│   └── package.json
│
└── docker-compose.yml   # Base de datos y servicios locales
```

---

## 🛠️ Comandos Útiles

### Desarrollo Frontend y Backend

```powershell
cd frontend

# Desarrollo con hot-reload (UI y API)
npm run dev

# Build para Producción
npm run build

# Prisma Studio (ver datos UI)
npx prisma studio

# Actualizar base de datos tras cambio en schema.prisma
npx prisma db push
```

---

## 📊 Tech Stack

| Capa | Tecnología |
|------|------------|
| **Frontend** | Next.js 16, React 19, TanStack Query, Tailwind CSS, Shadcn/ui |
| **Backend** | API Routes (Next.js), TypeScript, Prisma ORM |
| **Database** | PostgreSQL 16 |
| **Infraestructura** | Docker (DB), Node.js (App) |

---

## 📄 Licencia

Proyecto interno - Uso exclusivo del hotel.
