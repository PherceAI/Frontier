# Product Requirements Document (PRD): Project Frontier

> **El "Segundo Cerebro" del Hotel**

---

## Metadatos

| Campo | Valor |
|-------|-------|
| **Proyecto** | Frontier |
| **Versión** | 2.1.0 |
| **Fecha** | Febrero 2026 |
| **Stack** | Next.js 16, Laravel 12, PostgreSQL 16, Eloquent ORM |
| **Infraestructura** | Docker Compose (Local Dev) |
| **Filosofía** | "Divide y Vencerás" / Clean Architecture |

---

## 1. La Esencia: El Cerebro Invisible

Imagina que el hotel tiene un cuerpo físico (el edificio) y un **"segundo cerebro" digital**. Ese es Frontier.

Este sistema no viene a competir con el software de reservas (ERP) ni con el contador. Su misión es **capturar la realidad humana y operativa** que esos sistemas financieros no ven:

- ¿Cuántas toallas movió realmente la camarera?
- ¿A qué hora exacta arrancó la lavadora?
- ¿Dónde se rompió la cadena de suministro?

Frontier es una **plataforma web dual** que centraliza la data de forma **inmutable**. Es el hilo conductor que elimina el "yo no fui" y las notas de papel perdidas entre turnos.

---

## 2. Los Dos Mundos de Frontier

El sistema se divide radicalmente en dos experiencias de usuario opuestas pero conectadas.

### 🏗️ MUNDO 1: LA TORRE DE CONTROL (Gerencia)

**Acceso**: Directores y Gerentes (Web Desktop)
**Experiencia**: Precisión, control, data-dense

#### A. El Panel de "Dios" (Configuración)

Aquí creas la realidad del hotel. El sistema es flexible y crece contigo.

- **Gestión de Estructura**: Hoy creas el área "Lavandería" y "Pisos". Mañana agregas "Mantenimiento".
- **Fábrica de Empleados**: Contratas a "María", le asignas áreas, el sistema genera un **PIN de 4 dígitos**. Ese PIN es su pasaporte; si María se va, el PIN muere.

#### B. El Dashboard (La Verdad)

- **Semáforos de Cuello de Botella**: Indicador visual de "Demanda" vs "Oferta". Si las camareras bajaron 500 piezas y lavandería solo procesó 200, una barra roja te alerta.
- **El Juez (Trazabilidad)**: Si falta una sábana costosa, sabes qué camarera la reportó y en qué ciclo debió estar.
- **Inteligencia**: Cruce de datos (Ocupación vs. Gasto) para detectar desperdicios.

---

### 🖐️ MUNDO 2: LAS MANOS (Operativa)

**Acceso**: Empleados (Web Mobile)
**Experiencia**: Frictionless, tactile, bold

El empleado no analiza, solo reporta hechos. Su interfaz es **"Botón Grande"**, diseñada para dedos rápidos y cero fricción.

#### Escenario A: La Camarera (Origen de Demanda)

María termina el piso 2. Saca su celular.

1. Digita su PIN (4-8-2-9). El sistema la reconoce: *"Hola María"*
2. No escribe texto. Ve íconos grandes: `[Toalla Grande]` `[Sábana King]`
3. Toca `[+]` tres veces en Toallas
4. Presiona **"ENVIAR A LAVANDERÍA"**

**Impacto**: En ese segundo, el contador de "Ropa por Lavar" en la Torre de Control sube. Se ha generado **Demanda**.

#### Escenario B: La Lavandería (Procesamiento de Oferta)

Pedro llega a su turno. Ingresa su PIN.

1. **La Bienvenida**: No ve un menú vacío. El sistema le dice: *"Hola Pedro. Tienes 150 piezas pendientes"*
2. Llena la máquina y presiona: `[Registrar Ciclo]` → `[Carga de Toallas]`
3. Al finalizar, el sistema resta lo lavado de la nube de pendientes

**Continuidad**: Si Pedro no termina, el sistema guarda ese saldo para el turno de la mañana.

---

## 3. Arquitectura Técnica

### 3.1 Backend (El Cerebro) - Laravel 12

- **Validación**: FormRequests para datos perfectos
- **Patrón**: Modular Monolith (Services + Resources)
- **Inmutabilidad**: Ledger operativo write-only

### 3.2 Frontend (La Cara) - Next.js 16

- **App Router**: Navegación instantánea
- **UI Admin**: Shadcn/ui para tablas densas y dashboards
- **UI Operativa**: Componentes personalizados gigantes (Touch-first)
- **Estado**: TanStack Query para apps reactivas

### 3.3 Base de Datos (La Memoria) - PostgreSQL 16 + Eloquent

- **Docker**: Todo corre localmente en contenedores
- **Migrations**: Estructura versionada en código PHP
- **Inmutabilidad**: Los logs operativos no se borran, solo se añaden correcciones

---

## 4. Modelo de Datos (Resumen)

```
companies (Multi-hotel ready)
├── users (Managers - JWT Auth)
├── employees (Workers - PIN Auth)
│   └── employee_areas (N:M assignment)
├── operational_areas (SOURCE | PROCESSOR)
├── catalog_items (Assets tracked)
├── operational_events (The Ledger)
│   └── event_details (Line items)
├── employee_sessions (Active sessions)
└── audit_logs (Config changes)
```

> 📄 **Ver**: [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) para esquema completo.

---

## 5. Tipos de Eventos

| Tipo | Significado | Ejemplo |
|------|-------------|---------|
| `DEMAND` | Item enviado a procesar | María baja toallas sucias |
| `SUPPLY` | Item procesado | Pedro lava toallas |
| `CORRECTION` | Ajuste autorizado | Manager corrige conteo erróneo |

---

## 6. Estándares de Ingeniería

El desarrollador debe trabajar bajo la filosofía de **"Divide y Vencerás"**:

1. **Pensamiento Sistémico**: Antes de programar, entender cómo un cambio en "Pisos" afecta a "Lavandería"
2. **Código Limpio**: Variables descriptivas (`isLaundryCycleActive`), funciones pequeñas
3. **Auditoría Crítica**: "¿Qué pasa si se va el internet justo al enviar?" → Código robusto a fallos
4. **Skills Técnicos**: Arquitecto de Software + DBA Experto

---

## 7. Alcance V1 vs V2

### ✅ V1 (MVP)

| Feature | Incluido |
|---------|----------|
| Auth dual (JWT + PIN) | ✅ |
| CRUD de configuración | ✅ |
| Registro de eventos | ✅ |
| Dashboard en tiempo real | ✅ |
| Correcciones por manager | ✅ |
| Multi-hotel structure | ✅ (preparado) |

### 🔮 V2 (Roadmap)

| Feature | Status |
|---------|--------|
| Modo offline (PWA) | Planificado |
| Push notifications | Planificado |
| Reportes exportables | Planificado |
| Multi-idioma | Planificado |
| Integración ERP | Evaluando |

---

## 8. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| PIN fácil de adivinar | Media | Alto | Lockout después de 5 intentos |
| Pérdida de conectividad | Alta | Medio | V2: Cola offline en PWA |
| Conteo incorrecto | Media | Bajo | Correcciones autorizadas |
| Resistencia al cambio | Alta | Medio | UX extremadamente simple |
| Datos sensibles expuestos | Baja | Alto | RBAC + Audit logs |

---

## 9. Asunciones

1. **Dispositivos**: Empleados acceden desde smartphones propios o compartidos
2. **Conectividad**: WiFi estable en instalaciones (V1 requiere conexión)
3. **Turnos**: 2-3 turnos diarios, sesiones de 12 horas cubren la mayoría
4. **Volumen**: ~50-200 eventos diarios por área operativa
5. **Usuarios**: 1-5 admins, 10-50 empleados por propiedad

---

## 10. Métricas de Éxito

| Métrica | Target V1 |
|---------|-----------|
| Tiempo de registro (evento) | < 10 segundos |
| Adopción de empleados | > 80% en 2 semanas |
| Precisión de datos | > 95% |
| Tiempo de respuesta API | < 200ms p95 |
| Disponibilidad | > 99% |

---

## 11. Documentos Relacionados

| Documento | Propósito |
|-----------|-----------|
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | Esquema completo de BD |
| [API_SPECIFICATION.md](API_SPECIFICATION.md) | Contratos de API |
| [SECURITY_PROTOCOLS.md](SECURITY_PROTOCOLS.md) | Políticas de seguridad |
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | Plan de ejecución |
| [UX_DESIGN_SYSTEM.md](UX_DESIGN_SYSTEM.md) | Sistema de diseño UI |