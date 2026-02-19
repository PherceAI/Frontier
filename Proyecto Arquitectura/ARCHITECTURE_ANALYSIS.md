# 🏛️ Frontier: Análisis Arquitectónico Profundo

> **Fecha**: 13 de Febrero, 2026
> **Protocolo**: Sovereign-Fullstack-Architect + Skills: architecture, api-patterns, database-design
> **Objetivo**: Evaluar el estado actual, identificar brechas, y proponer una arquitectura modular y robusta lista para producción interna.

---

## 1. DIAGNÓSTICO DEL ESTADO ACTUAL

### 1.1 Lo que YA funciona bien ✅

| Componente | Estado | Observación |
|:-----------|:-------|:------------|
| **Infraestructura Docker** | ✅ Sólido | PostgreSQL + Laravel containerizado, health checks |
| **Cloudflare Tunnel** | ✅ Operativo | `api.pherce.com` / `app.pherce.com` funcionando |
| **Auth Dual** | ✅ Implementado | JWT (admins) + PIN Sessions (empleados) |
| **Ledger Inmutable** | ✅ Core listo | `operational_events` append-only con triggers |
| **Patrón Handler/Factory** | ✅ Buen inicio | `OperationHandler` interface + `OperationFactory` |
| **Frontend Dual** | ✅ Estructura | `/tower` (admin) y `/hands` (operativo) separados |
| **Integración ERP** | ✅ Parcial | Conexión Supabase para ocupación hotelera |
| **API Client** | ✅ Centralizado | `lib/api.ts` con manejo global de errores y auth |

### 1.2 Brechas Críticas Detectadas 🚨

| # | Brecha | Severidad | Impacto |
|:--|:-------|:----------|:--------|
| 1 | **Sin módulo de Tareas/Asignaciones** | 🔴 ALTA | No se pueden programar ni asignar tareas a empleados |
| 2 | **Sin módulo de Inventario** | 🔴 ALTA | No hay tracking de stock real (solo flujo DEMAND/SUPPLY) |
| 3 | **Sin módulo de Punto de Venta (POS)** | 🔴 ALTA | Datos de restaurante/bar no se capturan |
| 4 | **Sin cruce de datos inter-módulos** | 🔴 ALTA | No hay motor de correlación entre áreas |
| 5 | **Tipos TypeScript usan `any`** | 🟡 MEDIA | `lib/api.ts` tiene 15+ usos de `any`, rompe la sincronización sagrada |
| 6 | **Sin sistema de notificaciones** | 🟡 MEDIA | Sin alertas push/real-time para tareas vencidas |
| 7 | **Sin reportes exportables** | 🟡 MEDIA | Dashboard solo muestra data, no la exporta |
| 8 | **Sin scheduler de tareas** | 🟡 MEDIA | Laravel Scheduler no configurado para jobs automáticos |
| 9 | **Rutas de test en producción** | 🟡 MEDIA | `/test-overflow` y `/test-create-emp` expuestas |
| 10 | **Sin middleware de rate-limiting real** | 🟡 MEDIA | Definido en docs pero no implementado |

---

## 2. PROPUESTA DE ARQUITECTURA MODULAR

### 2.1 Filosofía: "Dominios Autónomos, Datos Cruzados"

Cada área del hotel opera con su propia lógica de negocio, pero el valor REAL de Frontier está en **cruzar datos entre dominios**. Proponemos una arquitectura de **Módulos de Dominio** (Domain Modules) dentro del Modular Monolith.

```
┌──────────────────────────────────────────────────────────────────┐
│                     FRONTIER PLATFORM                            │
├──────────────────────────────────────────────────────────────────┤
│  🧩 DOMAIN MODULES (Cada uno auto-contenido)                    │
│                                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ OPERATIONS  │ │  INVENTORY  │ │    POS       │               │
│  │ (Existing)  │ │  (NEW)      │ │ (NEW)       │               │
│  │ Housekeeping│ │ Stock Ctrl  │ │ Restaurant  │               │
│  │ Laundry     │ │ Purchases   │ │ Bar         │               │
│  │ Maintenance │ │ Suppliers   │ │ Room Service│               │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘               │
│         │               │               │                       │
│  ┌──────┴───────────────┴───────────────┴──────┐                │
│  │          📊 CROSS-DOMAIN ENGINE             │                │
│  │  Correlations, Analytics, Alerts, Reports   │                │
│  └──────┬───────────────┬───────────────┬──────┘                │
│         │               │               │                       │
│  ┌──────┴──────┐ ┌──────┴──────┐ ┌──────┴──────┐               │
│  │   TASKS     │ │    ERP      │ │  WORKFORCE  │               │
│  │ (NEW)       │ │ (Existing)  │ │ (NEW)       │               │
│  │ Scheduling  │ │ Supabase    │ │ Attendance  │               │
│  │ Assignments │ │ Occupancy   │ │ Performance │               │
│  │ Tracking    │ │ Revenue     │ │ Shifts      │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
├──────────────────────────────────────────────────────────────────┤
│  🔧 SHARED INFRASTRUCTURE                                       │
│  Auth | Notifications | Audit | File Storage | Scheduler        │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Estructura de Archivos Propuesta (Backend)

```
backend-laravel/app/
├── Modules/                          # 🧩 DOMAIN MODULES
│   ├── Operations/                   # (Ya existe, reorganizar)
│   │   ├── Controllers/
│   │   ├── Services/
│   │   │   ├── Handlers/
│   │   │   │   ├── HousekeepingHandler.php
│   │   │   │   ├── LaundryHandler.php
│   │   │   │   └── MaintenanceHandler.php  # NEW
│   │   │   └── OperationFactory.php
│   │   ├── Requests/
│   │   ├── Resources/
│   │   └── routes.php
│   │
│   ├── Tasks/                         # 🆕 MÓDULO DE TAREAS
│   │   ├── Controllers/
│   │   │   └── TaskController.php
│   │   ├── Models/
│   │   │   ├── Task.php
│   │   │   ├── TaskTemplate.php
│   │   │   └── TaskComment.php
│   │   ├── Services/
│   │   │   ├── TaskScheduler.php      # Programa tareas recurrentes
│   │   │   └── TaskAssigner.php       # Lógica de asignación
│   │   ├── Events/
│   │   │   ├── TaskAssigned.php
│   │   │   ├── TaskCompleted.php
│   │   │   └── TaskOverdue.php
│   │   ├── Requests/
│   │   ├── Resources/
│   │   └── routes.php
│   │
│   ├── Inventory/                     # 🆕 MÓDULO DE INVENTARIO
│   │   ├── Controllers/
│   │   │   ├── StockController.php
│   │   │   └── PurchaseOrderController.php
│   │   ├── Models/
│   │   │   ├── StockItem.php
│   │   │   ├── StockMovement.php      # Ledger de movimientos
│   │   │   ├── Supplier.php
│   │   │   └── PurchaseOrder.php
│   │   ├── Services/
│   │   │   ├── StockTracker.php       # Control de mínimos/máximos
│   │   │   └── ConsumptionAnalyzer.php
│   │   ├── Events/
│   │   │   ├── StockLow.php
│   │   │   └── StockReceived.php
│   │   └── routes.php
│   │
│   ├── POS/                           # 🆕 PUNTO DE VENTA
│   │   ├── Controllers/
│   │   │   ├── SaleController.php
│   │   │   └── MenuController.php
│   │   ├── Models/
│   │   │   ├── Sale.php
│   │   │   ├── SaleItem.php
│   │   │   └── MenuItem.php
│   │   ├── Services/
│   │   │   └── RevenueTracker.php
│   │   └── routes.php
│   │
│   ├── Workforce/                     # 🆕 GESTIÓN DE PERSONAL
│   │   ├── Controllers/
│   │   │   └── WorkforceController.php
│   │   ├── Models/
│   │   │   ├── Shift.php
│   │   │   ├── Attendance.php
│   │   │   └── PerformanceMetric.php
│   │   ├── Services/
│   │   │   ├── ShiftPlanner.php
│   │   │   └── PerformanceCalculator.php
│   │   └── routes.php
│   │
│   └── Analytics/                     # 🆕 MOTOR DE CRUCE
│       ├── Controllers/
│       │   └── AnalyticsController.php
│       ├── Services/
│       │   ├── CrossDomainEngine.php   # El corazón del cruce
│       │   ├── Correlators/
│       │   │   ├── OccupancyVsConsumption.php
│       │   │   ├── OccupancyVsLabor.php
│       │   │   ├── RevenueVsCost.php
│       │   │   └── TaskComplianceRate.php
│       │   └── ReportGenerator.php
│       └── routes.php
│
├── Shared/                           # 🔧 INFRAESTRUCTURA COMPARTIDA
│   ├── Notifications/
│   │   ├── Channels/
│   │   │   └── InAppChannel.php
│   │   └── TaskOverdueNotification.php
│   ├── Events/
│   │   └── DomainEvent.php           # Base event class
│   └── Contracts/
│       ├── Auditable.php
│       └── Trackable.php
│
├── Models/                           # Modelos core (existentes)
└── Http/                             # Middleware global
```

### 2.3 Estructura de Archivos Propuesta (Frontend)

```
frontend/src/
├── app/
│   ├── tower/                        # 🏗️ ADMIN (existente)
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx              # Dashboard principal
│   │   │   ├── tasks/                # 🆕 Gestión de tareas
│   │   │   │   └── page.tsx
│   │   │   ├── inventory/            # 🆕 Control de inventario
│   │   │   │   └── page.tsx
│   │   │   ├── pos/                  # 🆕 Punto de venta
│   │   │   │   └── page.tsx
│   │   │   ├── workforce/            # 🆕 Personal
│   │   │   │   └── page.tsx
│   │   │   ├── analytics/            # 🆕 Cruces de datos
│   │   │   │   └── page.tsx
│   │   │   ├── areas/                # (existente)
│   │   │   ├── employees/            # (existente)
│   │   │   └── rooms/                # (existente)
│   │   └── login/
│   │
│   └── hands/                        # 🖐️ OPERATIVO (existente)
│       ├── page.tsx                  # PIN Login
│       ├── housekeeping/
│       ├── laundry/
│       ├── tasks/                    # 🆕 Mis tareas asignadas
│       │   └── page.tsx
│       └── dashboard/
│
├── types/                            # 🆕 TIPADO FUERTE
│   ├── api.ts                        # (existente, refactorizar)
│   ├── operations.ts                 # (existente)
│   ├── tasks.ts                      # 🆕
│   ├── inventory.ts                  # 🆕
│   ├── pos.ts                        # 🆕
│   ├── workforce.ts                  # 🆕
│   └── analytics.ts                  # 🆕
│
└── services/                         # 🆕 API por módulo
    ├── operations.ts                 # (existente)
    ├── tasks.ts                      # 🆕
    ├── inventory.ts                  # 🆕
    ├── pos.ts                        # 🆕
    └── workforce.ts                  # 🆕
```

---

## 3. NUEVOS MÓDULOS: DISEÑO DETALLADO

### 3.1 🆕 Módulo de TAREAS (Tasks)

**Propósito**: Programar tareas, asignarlas a empleados, y hacer seguimiento del cumplimiento.

#### Modelo de Datos

```sql
-- Plantillas de tareas recurrentes
CREATE TABLE task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    area_id UUID REFERENCES operational_areas(id),    -- Área destino
    priority SMALLINT DEFAULT 2,                       -- 1=Urgente, 2=Normal, 3=Baja
    estimated_minutes INT,                             -- Duración estimada
    recurrence_rule VARCHAR(100),                      -- 'DAILY', 'WEEKLY:MON,WED,FRI', 'MONTHLY:15'
    checklist JSONB,                                   -- [{"label":"Limpiar baño","required":true}]
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Instancias de tareas (asignadas)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    template_id UUID REFERENCES task_templates(id),    -- NULL si es tarea ad-hoc
    title VARCHAR(200) NOT NULL,
    description TEXT,
    area_id UUID REFERENCES operational_areas(id),
    assigned_to UUID REFERENCES employees(id),         -- Empleado asignado
    assigned_by UUID REFERENCES users(id),             -- Manager que asignó
    status VARCHAR(20) DEFAULT 'PENDING',              -- PENDING | IN_PROGRESS | COMPLETED | OVERDUE | CANCELLED
    priority SMALLINT DEFAULT 2,
    due_date TIMESTAMP,                                -- Fecha/hora límite
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    checklist_progress JSONB,                          -- Estado de cada item del checklist
    completion_notes TEXT,
    completion_photo_url VARCHAR(500),                 -- Evidencia fotográfica
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tasks_assigned ON tasks(assigned_to, status, due_date);
CREATE INDEX idx_tasks_area ON tasks(company_id, area_id, status);
CREATE INDEX idx_tasks_due ON tasks(due_date) WHERE status IN ('PENDING', 'IN_PROGRESS');

-- Comentarios/notas en tareas
CREATE TABLE task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id),
    author_type VARCHAR(10) NOT NULL,                  -- 'USER' | 'EMPLOYEE'
    author_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### API Endpoints

```
# Admin (JWT)
GET    /api/tasks                    # Listar tareas (filtros: area, employee, status, date)
POST   /api/tasks                    # Crear tarea (ad-hoc o desde template)
PATCH  /api/tasks/:id                # Actualizar tarea
DELETE /api/tasks/:id                # Cancelar tarea
GET    /api/tasks/compliance         # Tasa de cumplimiento por área/empleado

# Templates (JWT)
GET    /api/task-templates           # Listar plantillas
POST   /api/task-templates           # Crear plantilla
PATCH  /api/task-templates/:id       # Editar plantilla

# Empleado (PIN Session)
GET    /api/my-tasks                 # Tareas asignadas al empleado
PATCH  /api/my-tasks/:id/start       # Marcar como "en progreso"
PATCH  /api/my-tasks/:id/complete    # Completar tarea (con checklist + notas)
```

#### Cruces de Datos Posibles
- **Tasa de cumplimiento por empleado** → Detecta quién necesita capacitación
- **Tiempo promedio por tipo de tarea** → Optimiza asignación de turnos
- **Tareas vencidas por área** → Identifica cuellos de botella organizativos

---

### 3.2 🆕 Módulo de INVENTARIO (Inventory)

**Propósito**: Tracking real de stock, alertas de mínimos, y cruce con consumo operativo.

#### Modelo de Datos

```sql
-- Items de inventario (extiende catalog_items)
CREATE TABLE stock_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    catalog_item_id UUID REFERENCES catalog_items(id), -- Link con catálogo operativo
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,                     -- 'LINEN', 'AMENITY', 'FOOD', 'CLEANING', 'MAINTENANCE'
    unit VARCHAR(20) DEFAULT 'piece',
    current_stock DECIMAL(10,2) DEFAULT 0,
    min_stock DECIMAL(10,2) DEFAULT 0,                 -- Alerta cuando baja de aquí
    max_stock DECIMAL(10,2),
    cost_per_unit DECIMAL(10,2),                       -- Costo unitario ($)
    supplier_id UUID REFERENCES suppliers(id),
    location VARCHAR(100),                             -- 'Bodega A', 'Almacén cocina'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Movimientos de inventario (Ledger inmutable)
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    stock_item_id UUID NOT NULL REFERENCES stock_items(id),
    movement_type VARCHAR(20) NOT NULL,                -- 'IN' (compra/recepción) | 'OUT' (consumo) | 'ADJUSTMENT' | 'TRANSFER'
    quantity DECIMAL(10,2) NOT NULL,                   -- Positivo o negativo
    reference_type VARCHAR(30),                        -- 'PURCHASE_ORDER' | 'OPERATIONAL_EVENT' | 'MANUAL'
    reference_id UUID,                                 -- ID del documento origen
    performed_by UUID NOT NULL,                        -- employee_id o user_id
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_item ON stock_movements(stock_item_id, created_at DESC);

-- Proveedores
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name VARCHAR(200) NOT NULL,
    contact_name VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Órdenes de compra
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    order_number VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'DRAFT',                -- DRAFT | SENT | PARTIAL | RECEIVED | CANCELLED
    total_amount DECIMAL(12,2),
    notes TEXT,
    ordered_at TIMESTAMP,
    received_at TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Cruces de Datos Posibles
- **Consumo por habitación ocupada** = `stock_out / occupied_rooms` → Costo real por huésped
- **Anomalías de consumo** → Si la lavandería reportó 100 toallas (DEMAND) pero inventario solo movió 50, hay una discrepancia
- **Predicción de compra** → Basado en ocupación proyectada del ERP

---

### 3.3 🆕 Módulo de POS (Punto de Venta)

**Propósito**: Capturar datos de ventas de restaurante, bar, room service para cruzar con ocupación.

#### Modelo de Datos

```sql
CREATE TABLE pos_outlets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name VARCHAR(100) NOT NULL,                        -- 'Restaurante', 'Bar', 'Room Service'
    type VARCHAR(30) NOT NULL,                         -- 'RESTAURANT' | 'BAR' | 'ROOM_SERVICE' | 'SPA'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE pos_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    outlet_id UUID NOT NULL REFERENCES pos_outlets(id),
    room_number VARCHAR(10),                           -- Link a habitación del ERP
    employee_id UUID REFERENCES employees(id),         -- Quién registró
    total_amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(20),                        -- 'CASH' | 'CARD' | 'ROOM_CHARGE' | 'COMPS'
    guest_count INT,
    notes TEXT,
    sale_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE pos_sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES pos_sales(id),
    item_name VARCHAR(200) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    category VARCHAR(50)                               -- 'FOOD' | 'BEVERAGE' | 'OTHER'
);
```

#### Cruces de Datos Posibles
- **Revenue per Occupied Room (RevPOR)** = `total_sales / occupied_rooms`
- **F&B ratio por segmento** → ¿Los ejecutivos gastan más en bar que las familias?
- **Consumo de inventario vs ventas** → Detecta "shrinkage" (merma/robo)

---

### 3.4 🆕 Motor de Cruce de Datos (Analytics)

Este es el **corazón diferenciador** de Frontier.

```php
// CrossDomainEngine.php - El cerebro del cruce

class CrossDomainEngine
{
    /**
     * Generar reporte de eficiencia operativa diaria
     * Cruza: Ocupación (ERP) + Operaciones + Tareas + Inventario + POS
     */
    public function dailyOperationalReport(string $companyId, string $date): array
    {
        return [
            'occupancy' => $this->erpData($companyId, $date),
            'operations' => [
                'demand_total' => ...,
                'supply_total' => ...,
                'pending_ratio' => ...,
                'bottlenecks' => $this->bottleneckAnalysis($companyId, $date),
            ],
            'tasks' => [
                'assigned' => ...,
                'completed' => ...,
                'overdue' => ...,
                'compliance_rate' => ...,   // % cumplimiento
            ],
            'inventory' => [
                'consumption_value' => ..., // $ consumido hoy
                'low_stock_alerts' => ...,
                'cost_per_occupied_room' => ..., // Cruce clave
            ],
            'revenue' => [
                'total_pos_sales' => ...,
                'revpor' => ...,            // Revenue Per Occupied Room
                'by_outlet' => [...],
            ],
            'workforce' => [
                'active_employees' => ...,
                'avg_task_completion_time' => ...,
                'top_performers' => [...],
            ],
            'correlations' => [            // 🔥 EL VALOR REAL
                'occupancy_vs_consumption' => ...,
                'occupancy_vs_labor' => ...,
                'revenue_vs_cost' => ...,
            ],
        ];
    }
}
```

---

## 4. PRIORIZACIÓN PARA PRODUCCIÓN

### Fase 1: Estabilización (1-2 semanas)
> **Meta**: Lo que ya existe funciona de forma robusta.

| # | Tarea | Impacto |
|:--|:------|:--------|
| 1.1 | Eliminar rutas de test (`/test-overflow`, `/test-create-emp`) | 🔴 Seguridad |
| 1.2 | Implementar rate-limiting real en middleware | 🔴 Seguridad |
| 1.3 | Eliminar todos los `any` en `lib/api.ts` y hacer tipado fuerte | 🟡 Mantenibilidad |
| 1.4 | Configurar Laravel Scheduler para limpieza de sesiones expiradas | 🟡 Operaciones |
| 1.5 | Agregar Mantenimiento como área handler (`MaintenanceHandler`) | 🟡 Funcionalidad |
| 1.6 | Implementar Security Headers en middleware de Laravel | 🟡 Seguridad |

### Fase 2: Módulo de Tareas (2-3 semanas)
> **Meta**: Programar, asignar y rastrear tareas de empleados.

| # | Tarea | Tipo |
|:--|:------|:-----|
| 2.1 | Crear migraciones de `task_templates`, `tasks`, `task_comments` | Backend |
| 2.2 | Implementar `TaskController` + `TaskScheduler` service | Backend |
| 2.3 | API: CRUD de templates + asignación + completar | Backend |
| 2.4 | Frontend Tower: Tabla de tareas + filtros + asignación | Frontend |
| 2.5 | Frontend Hands: "Mis Tareas" con checklist interactivo | Frontend |
| 2.6 | Job automático: Marcar como OVERDUE las tareas vencidas | Backend |
| 2.7 | Notificaciones in-app para tareas nuevas/vencidas | Full-stack |

### Fase 3: Módulo de Inventario (2-3 semanas)
> **Meta**: Control de stock real con alertas y cruce con operaciones.

| # | Tarea | Tipo |
|:--|:------|:-----|
| 3.1 | Crear migraciones de `stock_items`, `stock_movements`, `suppliers`, `purchase_orders` | Backend |
| 3.2 | Implementar `StockController` + `StockTracker` | Backend |
| 3.3 | Link automático: Cuando un evento DEMAND crea, descontar del stock | Backend |
| 3.4 | Frontend Tower: Dashboard de inventario con alertas de mínimos | Frontend |
| 3.5 | Frontend Tower: Órdenes de compra + recepción | Frontend |

### Fase 4: POS + Analytics (3-4 semanas)
> **Meta**: Captura de ventas y el motor de cruce.

| # | Tarea | Tipo |
|:--|:------|:-----|
| 4.1 | Módulo POS: Registro de ventas por outlet | Full-stack |
| 4.2 | `CrossDomainEngine`: Reporte diario operativo | Backend |
| 4.3 | Frontend Tower: Dashboard de Analytics con correlaciones | Frontend |
| 4.4 | Reportes exportables (PDF/Excel) | Backend |

### Fase 5: Workforce + Polish (2 semanas)
> **Meta**: Gestión completa de personal y pulido final.

| # | Tarea | Tipo |
|:--|:------|:-----|
| 5.1 | Asistencia y control de turnos | Full-stack |
| 5.2 | Métricas de rendimiento por empleado | Backend |
| 5.3 | Checklist pre-deploy de seguridad | DevOps |

---

## 5. REGLAS DE INTERACCIÓN ENTRE MÓDULOS

### Principio: "Eventos de Dominio" (Domain Events)

Los módulos NO se llaman directamente. Emiten **eventos** que otros módulos escuchan.

```
┌──────────────┐    TaskCompleted    ┌──────────────┐
│    Tasks     │ ─────────────────▶  │  Workforce   │
│              │                     │ (Actualiza   │
│              │                     │  performance)│
└──────────────┘                     └──────────────┘

┌──────────────┐  OperationalEvent   ┌──────────────┐
│  Operations  │ ─────────────────▶  │  Inventory   │
│ (DEMAND)     │                     │ (Descuenta   │
│              │                     │  stock auto) │
└──────────────┘                     └──────────────┘

┌──────────────┐    StockLow         ┌──────────────┐
│  Inventory   │ ─────────────────▶  │  Tasks       │
│ (Stock bajo) │                     │ (Genera tarea│
│              │                     │  de compra)  │
└──────────────┘                     └──────────────┘
```

**Implementación en Laravel:**
```php
// Usar Laravel Events + Listeners
// app/Modules/Operations/Events/DemandCreated.php
class DemandCreated
{
    public function __construct(
        public readonly OperationalEvent $event,
        public readonly array $items
    ) {}
}

// app/Modules/Inventory/Listeners/DeductStockOnDemand.php
class DeductStockOnDemand
{
    public function handle(DemandCreated $event): void
    {
        foreach ($event->items as $item) {
            $this->stockTracker->deduct($item['item_id'], $item['quantity'], $event->event->id);
        }
    }
}
```

---

## 6. RESUMEN EJECUTIVO

| Aspecto | Estado Actual | Con Esta Propuesta |
|:--------|:-------------|:-------------------|
| **Módulos** | 2 (Operations, ERP) | 6 (+ Tasks, Inventory, POS, Workforce, Analytics) |
| **Cruce de datos** | ❌ No existe | ✅ `CrossDomainEngine` con correlaciones |
| **Tareas/Asignaciones** | ❌ No existe | ✅ Scheduling + Tracking + Compliance |
| **Inventario** | ❌ No existe | ✅ Stock real + Alertas + Link con operaciones |
| **Punto de Venta** | ❌ No existe | ✅ Ventas por outlet + RevPOR |
| **Tipado Front↔Back** | 🟡 Parcial (`any`) | ✅ Interfaces TypeScript por módulo |
| **Interacción modular** | N/A | ✅ Domain Events (desacoplado) |
| **Producción** | 🟡 No listo | ✅ Checklist de seguridad completo |

---

> **Siguiente paso recomendado**: Confirmar prioridades (¿Tareas primero o Inventario?) y comenzar con la **Fase 1: Estabilización** inmediatamente.
