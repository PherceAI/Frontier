# Guía de Operación: Frontier 🚀

Bienvenido al "Segundo Cerebro" de tu hotel. Esta guía explica cómo fluye la información en el sistema para que le saques el máximo provecho.

## 1. El Concepto: Origen vs. Operación

En Frontier, el hotel se organiza en dos tipos de áreas:

- **Punto de Origen (SOURCE / Demanda)**: Áreas que "generan" trabajo o insumos para procesar.
  - **Camareras**: Recolectan blancos de habitaciones (sábanas, toallas, etc.).
  - **Limpieza**: Registran aseo de áreas públicas, lobbies, baños comunes.
- **Punto de Operación (PROCESSOR / Suministro)**: Áreas que "procesan" el trabajo generado.
  - **Lavandería**: Procesa los blancos recolectados por Camareras (ciclos de lavado).
  - **Cocina**: Gestiona la preparación de alimentos y bebidas (A&B).

## 2. El Flujo de Trabajo

### Paso 1: Configuración (Torre de Control - `/tower`)
1.  **Crear Áreas**: Define tus 4 áreas operativas (Camareras, Lavandería, Limpieza, Cocina).
2.  **Crear Colaboradores**: Registra a tu personal y asígnalos a sus áreas correspondientes. El sistema les generará un **PIN de acceso**.

### Paso 2: La Operación (Portal Hands - `/hands`)
El personal operativo utiliza la versión móvil con su PIN:
1.  **Camareras**: Registran recolección de blancos por habitación.
2.  **Lavandería**: Ven pendientes de blancos y registran ciclos de lavado completados.
3.  **Limpieza**: Registran tareas de aseo en áreas públicas.
4.  **Cocina**: Registran preparaciones y pedidos de alimentos.

### Paso 3: El Control (Dashboard)
Los directores ven en tiempo real:
- **Balance Operativo**: ¿Estamos procesando lo que se solicita?
- **Cuellos de Botella**: Si la demanda es mayor que el suministro, verás indicadores de alerta.
- **Datos cruzados (BI)**: Toda la actividad converge en el ledger transaccional para análisis gerencial.

## 3. Escalabilidad
El sistema está diseñado para soportar hasta **12 áreas operativas** futuras (Recepción, Mantenimiento, Spa, etc.), cada una con su propio módulo de lógica de negocio independiente en el backend.

---
*Frontier elimina el papel y los "yo no fui", dándote la verdad absoluta de tu operación.*
