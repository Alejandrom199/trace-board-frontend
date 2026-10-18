# ADR-002: historial de sesión y límites entre aplicaciones

- Fecha: 2026-10-13
- Estado: aceptada para historial; estructura web/api acordada para Etapa 2.

## Contexto
El usuario aprobó deshacer/rehacer como siguiente mejora del prototipo y exigió separar backend de frontend. El prototipo actual es solo frontend. La persistencia local ya usa IndexedDB con lectura compatible de localStorage, que conserva la copia anterior.

## Decisiones
- Implementar historial mediante funciones puras en aplicación y un hook en presentación; no introducir un bus de comandos ni cambios al modelo persistido.
- Retener 50 acciones por investigación en memoria con snapshots inmutables. Compartir adjuntos y datos que no cambian, sin serializar/clonar payloads para cada snapshot.
- Registrar creación/edición/eliminación de tarjetas y relaciones, incorporación de recursos y movimiento. Agrupar cada gesto de arrastre como una sola acción. Excluir zoom, paneo y selección.
- Mantener el viewport al deshacer/rehacer. Restaurar elementos y sus referencias en conjunto; aplicar el autoguardado al resultado. Rehidratar el inspector al recorrer historial para no mostrar valores anteriores.
- No interceptar Ctrl/Cmd+Z dentro de campos editables o diálogos. Soportar Ctrl/Cmd+Shift+Z y Ctrl+Y para rehacer; ofrecer botones visibles.
- Mantener historial separado al cambiar de investigación. No persistirlo: recargar conserva el resultado guardado, pero inicia una sesión sin historial.
- Cuando se comience Etapa 2, usar apps/web para Next.js y apps/api para NestJS con builds/dependencias independientes. Crear packages/contracts únicamente para contratos consumidos por ambas aplicaciones. Comunicación por API, no imports del backend desde la UI ni acceso directo del frontend a la base de datos.

## Alternativas
- Historial del canvas: no cubre los cambios de dominio ni la restauración coherente de relaciones/adjuntos.
- Comandos reversibles/diffs para cada caso de uso: optimizan retención en proyectos grandes, pero exigen más código y posibilidades de error en este prototipo. Reconsiderar si el volumen medido lo requiere.
- Persistir todos los snapshots: aumenta almacenamiento y exige política de recuperación/versionado; fuera del alcance actual.
- Backend dentro de rutas Next.js: contradice la separación solicitada y mezcla responsabilidades de infraestructura con el frontend.

## Consecuencias
Eliminar una tarjeta se puede revertir con sus datos asociados durante la sesión. Una nueva acción tras deshacer invalida el futuro, como en editores convencionales. Crear/importar investigaciones no forma parte del historial de tarjetas; cada investigación nueva empieza vacía de acciones. Mantener muchas versiones con adjuntos grandes retiene memoria hasta el límite de acciones: medir antes de introducir un historial por diffs. No se crean carpetas o paquetes vacíos ni se implementa backend en esta entrega.
