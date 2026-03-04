# Cierre de modelo - Inventario

## 1) Modelo final de datos (solo lo que importa)

### Branch (collection: branches)
- Campos: id, name, active, createdAt.
- Uso: catalogo dinamico de sucursales; solo las activas se muestran en UI.

### Item (collection: items)
- Campos obligatorios: name, category, quantity, criticalThreshold, branch, code, lastModified.
- Campos opcionales: description, migrated, migratedFrom, migrationDate, migrationUser, originalQuantity, branchBackfilled.
- Relacion implicita: items.branch referencia branches.id.

### History (collection: history)
- Campos obligatorios: type, timestamp, userEmail, branch, branchName.
- Campos segun evento: itemId, itemName, itemCode, category, quantityBefore, quantityAfter, quantityChanged, motivo, fecha, hora, year, month, day, weekNumber, itemsCount, details, branchBackfilled.
- Relacion implicita: history.itemId referencia items.id (si existe).

## 2) Supuestos de negocio obligatorios

- items.branch siempre debe existir y ser valido.
- history.branch y history.branchName siempre deben existir para trazabilidad y filtros.
- branches.active controla visibilidad y seleccion en UI.
- Motivo es obligatorio en salidas de inventario.

Opcionales:
- items.description.
- history.itemId en eventos de sistema o globales.
- Campos de migracion solo aplican al flujo de migracion.

## 3) Invariantes del sistema

- No debe existir stock negativo.
- criticalThreshold debe ser positivo.
- criticalThreshold no debe ser mayor que la cantidad inicial al crear items.
- Toda operacion de inventario debe estar asociada a una sucursal.
- La opcion "Global" (all) es vista agregada, no una sucursal real.

## 4) Decisiones conscientes

- Sucursales dinamicas via branches para evitar hardcode.
- branch obligatorio en items y history para evitar desapariciones por filtros.
- Backfill:
  - items sin branch -> default (santiago o primera activa).
  - history sin branch -> copiar desde itemId si existe, o "unknown" si no.
- branchName se guarda en history para reportes legibles sin lookup.

## 5) Riesgos residuales

- Escrituras externas a la app que omitan branch pueden romper filtros.
- Desactivar branches.active puede ocultar inventarios y dejar seleccion invalida.
- Migracion actual asume solo Santiago y Valparaiso; requiere revision si crecen sucursales.

Senales de alerta temprana:
- Inventario vacio en sucursal con datos esperados.
- Reportes sin historial por branch.
- Sucursales nuevas que no aparecen en selectores.

## 6) Checklist mental para cambios futuros

- Estoy creando o editando items? -> Asegurar branch valido.
- Estoy escribiendo history? -> Incluir branch y branchName.
- Estoy mostrando sucursales? -> Usar branches activas dinamicas.
- Estoy filtrando por branch? -> Confirmar datos legacy con backfill.
- Hay eventos globales? -> Usar branch = all o unknown de forma explicita.
- Cambia algo en migracion o backfill? -> Revisar supuestos y limites.
