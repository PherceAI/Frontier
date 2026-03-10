# 🌊 Flujo de Operaciones: Camareras y Lavandería

Este documento describe el flujo lógico y la arquitectura técnica para la gestión del ciclo de lavandería entre los departamentos de **Pisos (Camareras)** y **Lavandería**.

## 1. El Flujo Lógico de Negocio

1. **Turno de Camareras (07:00 AM - 03:00/04:00 PM)**
   - Trabajan de Lunes a Sábado.
   - Bajan ropa de cama y toallas sucias a lavandería en uno o varios viajes durante su turno.
   - Cada entrega se registra en el sistema.
   - El sistema totaliza lo entregado por cada camarera al final de su turno.

2. **Inicio Turno Lavandería Tarde (03:00 PM - 10:00 PM)**
   - La encargada de lavandería inicia su turno y ve el **Total Pendiente**.
   - El inventario inicial pendiente es la suma de todo lo que han bajado las camareras en el turno de la mañana, separado por items y por camarera.
   - Items controlados:
     - Toallas: Grandes, Medianas, Pequeñas.
     - Sábanas: Grandes, Medianas, Pequeñas.

3. **Ciclo de Lavado (03:00 PM - 10:00 PM)**
   - La encargada procesa lavados por ciclos y registra en el sistema las cantidades y tipos de items lavados.
   - El sistema va descontando del total pendiente.

4. **Cierre de Turno y Traspaso (10:00 PM)**
   - Se cierra el turno.
   - Todo queda registrado en la vitácora digital de Lavandería y Camareras.
   - El saldo **restante (no lavado)** se convierte automáticamente en el inventario inicial para el turno de Lavandería del día siguiente (07:00 AM - 03:00 PM).

---

## 2. Arquitectura Técnica Recomendada (Next.js + Postgres + Prisma)

### A. Base de Datos (Prisma)
Necesitaremos registrar movimientos (Transacciones) en lugar de solo actualizar estados, para mantener la trazabilidad (vitácora).

```prisma
// schema.prisma (Propuesta conceptual)

enum OperationType {
  DROP_OFF  // Camarera deja ropa sucia
  WASH      // Lavandería lava ropa
}

enum ItemType {
  TOWEL_LARGE
  TOWEL_MEDIUM
  TOWEL_SMALL
  SHEET_LARGE
  SHEET_MEDIUM
  SHEET_SMALL
}

model LaundryTransaction {
  id          String        @id @default(uuid())
  type        OperationType
  itemType    ItemType
  quantity    Int
  createdAt   DateTime      @default(now())

  // Relaciones
  createdBy   String        // ID del empleado que registra (Camarera o Lavandera)
  employee    Employee      @relation(fields: [createdBy], references: [id])
}
```

### B. Lógica de Backend (API Routes)
Siguiendo las buenas prácticas (Route Handlers, no Server Actions):

1. **`POST /api/operations/laundry/dropoff`**
   - Recibe la entrega parcial de una camarera.
   - Valida datos con Zod.
   - Crea un `LaundryTransaction` de tipo `DROP_OFF`.

2. **`GET /api/operations/laundry/pending`**
   - Calcula el stock sucio actual.
   - Query: Suma todos los `DROP_OFF` y resta todos los `WASH`.
   - Agrupa los `DROP_OFF` del día por camarera para que la lavandería sepa exactamente quién bajó qué.

3. **`POST /api/operations/laundry/wash`**
   - Registra que un ciclo de lavado ha terminado.
   - Crea un `LaundryTransaction` de tipo `WASH`.

### C. Frontend (App Routes)
Usando TanStack Query para fetching de datos y shadcn/ui para la interfaz:

- **Módulo Camareras (`/hands/pisos/dropoff`)**:
  - Formulario sencillo (react-hook-form) para ingresar cantidades entregadas en ese momento.
- **Módulo Lavandería (`/hands/laundry/dashboard`)**:
  - **Vista "Stock Inicial / Pendiente"**: Ejecuta un `useQuery` al endpoint `pending`. Muestra una tabla/grid agrupado por camarera mostrando toallas y sábanas.
  - **Vista "Registrar Lavado"**: Formulario rápido (`useMutation`) donde anota qué lavó en cada ciclo. Al guardar, invalida la caché de React Query para actualizar el stock pendiente automáticamente en tiempo real.
