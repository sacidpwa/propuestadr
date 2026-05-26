
# Plan: Módulo Benesse / Multi-unidad de salud

Vamos a construir un sistema completo de gestión operativa para las unidades de salud (Benesse, Senior Living, CT Alcatraces), con nuevos roles, aplicativos por unidad y un panel central para Esther que consolida todo.

Por el tamaño, lo dividiré en **5 fases entregables**. Cada fase es funcional por sí sola — al terminar cada una podemos revisar antes de seguir.

---

## Arquitectura general

### Unidades de salud
Tabla `health_units` (Benesse, Senior Living, CT Alcatraces). Todo aplicativo se asocia a una unidad.

### Nuevos roles
- `enfermera` — operativo en una unidad (control medicamentos, menús, requisiciones de medicamentos, mantenimiento, pago a proveedores, órdenes de mantenimiento).
- `intendencia` — requisiciones de limpieza.
- `mantenimiento` — recibe órdenes de mantenimiento asignadas.
- `asistente_admin` (Diana) — gastos/ingresos, compras autorizadas, órdenes de pago.
- `contador` (Iván) — facturas de ingreso de pacientes, recibos de nómina SAT, cuotas de clientes.
- `rrhh` (Eduardo) — plantilla de empleados, incidencias, nómina.
- `empleado` — solo descarga su recibo de nómina.

Esther usa su rol `administrativo` extendido como **supervisora** que ve todos los aplicativos por unidad y valida con PIN.

### Panel central de Esther
Ruta `/synapsia/unidades` → lista de unidades → al entrar a una unidad, grid de aplicativos:
1. Control de medicamentos
2. Control de gastos
3. Ingresos (facturas)
4. Nómina
5. Requisición de medicamentos
6. Requisición de limpieza
7. Requisición de mantenimiento
8. Órdenes de mantenimiento
9. Pago a proveedores
10. Cartera de clientes (cobranza)

---

## Fase 1 — Cimientos (roles, unidades, asignaciones)

- Migración: `health_units`, `employee_assignments` (user_id ↔ unidad ↔ área: enfermería/intendencia/admin/abastecimiento/mantenimiento).
- Nuevos roles en enum `app_role`: `enfermera`, `intendencia`, `mantenimiento`, `asistente_admin`, `contador`, `rrhh`, `empleado`.
- UI en `UsersAdmin` para asignar usuario→unidad→área.
- Panel `/synapsia/unidades` y `/synapsia/unidades/:id` (vacío con grid de tarjetas de aplicativos, placeholders).
- Función `current_user_unit(user_id)` security-definer para RLS.

## Fase 2 — Enfermería (clínico-operativo)

- **Control de medicamentos**: tabla `medication_log` (paciente, medicamento, dosis, hora, enfermera, tipo: medicamento/estudio/consulta/salida). Hoja por paciente, registra automáticamente quién y cuándo.
- **Menú semanal**: tabla `meal_plans` (paciente, semana, comidas) + `meal_intake` (evaluación si comió).
- Aplicativo de enfermería: `/synapsia/enfermeria` con tabs por paciente de su unidad.

## Fase 3 — Requisiciones y órdenes

Modelo unificado `requisitions` con `type`: `medicamentos | limpieza | mantenimiento | servicio_mantenimiento | pago_proveedor`. Estados: `pendiente → autorizada/rechazada → comprada/pagada`. Cada item con cantidad, descripción, imagen opcional (storage bucket `requisitions`).

- Enfermera/intendencia crean requisiciones.
- Esther autoriza item por item con PIN.
- Diana ve órdenes de compra autorizadas → marca como compradas.
- Mantenimiento ve servicios asignados.
- Pagos a proveedores: Esther verifica pago con PIN registrando método.

## Fase 4 — Finanzas (gastos, ingresos, cobranza)

- **Gastos/Ingresos (Diana)**: extender `expense_entries` con `health_unit_id`, `receipt_url`, `operation_date`, tipo (gasto/ingreso/orden_pago). Bucket `receipts`. Balance por unidad.
- **Facturas de ingreso (Iván)**: tabla `patient_invoices` (paciente, monto, archivo factura, status: pendiente/verificada/erronea). Esther verifica con PIN. Sumatorias por estado.
- **Cuotas y cartera (Iván + Esther)**: tabla `client_fees` (paciente, monto, fecha_pago_acordada, recurrencia). Vista de morosos cuando fecha vencida sin pago registrado.

## Fase 5 — Nómina (Eduardo + Iván + empleados)

- `employees` (nombre, sueldo_diario, cuenta_bancaria, unidad, área, status).
- `payroll_incidents` (calendario diario por empleado: asistencia, falta justificada/injustificada con motivo, retardo, amonestación, sanción).
- Regla automática: 3 retardos → sanción económica.
- `payroll_runs` quincenal con propuesta calculada.
- Esther autoriza con PIN.
- Iván ve resumen autorizado → sube PDF de recibo SAT por empleado.
- Empleado entra a `/synapsia/mi-recibo` y descarga.

---

## Detalles técnicos

- Todas las tablas con RLS por rol + unidad (vía `current_user_unit` o `employee_assignments`).
- Storage buckets: `receipts` (privado), `requisitions` (privado), `payroll-receipts` (privado, solo dueño/empleado).
- Validaciones con `PinPrompt` ya existente para acciones críticas (autorizar, verificar pago, autorizar nómina).
- Auditoría en `audit_log` para toda autorización/verificación con PIN.
- Edge function existente `admin-create-user` solo necesita agregar los nuevos roles al `ALLOWED_ROLES`.

---

## Pregunta antes de empezar

¿Arranco con **Fase 1 (cimientos)** ahora? Es la base de todo lo demás y sin ella los aplicativos posteriores no pueden segmentar por unidad. Las siguientes fases las hacemos una por una para que puedas revisar y dar feedback en cada entrega.

Si prefieres priorizar una fase distinta primero (ej. nómina porque es lo más urgente para Eduardo), dímelo y arranco por ahí.
