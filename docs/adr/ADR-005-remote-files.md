# ADR-005: originales remotos de PDF e imágenes

- Fecha: 2026-10-13
- Estado: aceptada para el incremento de archivos remotos

## Alcance y decisión
Guardar y recuperar PDF, PNG, JPEG, GIF y WebP con la investigación. Conservar IndexedDB y datos existentes. Office mantiene metadatos; no añadir autenticación, IA o servicios externos en esta entrega.

Una tabla `investigation_files` almacena metadatos, SHA-256 y bytes (bytea), fuera del snapshot JSONB del tablero. El backend valida nombre, extensión, MIME, firma básica y límite de 10 MiB. POST /api/investigations/:id/files recibe bytes application/octet-stream y nombre/MIME en encabezados; GET /:id/files/:fileId recupera contenido con nosniff, cabeceras de descarga y sin caché. Identificadores públicos UUID; sin rutas suministradas por el cliente. Una referencia del tablero debe pertenecer a la misma investigación y coincidir con sus metadatos/hash.

Guardar en base de datos sube primero los binarios pendientes, secuencialmente; solo confirma el tablero tras PUT con revisión. Las subidas son inmutables e idempotentes por investigación, nombre y SHA-256. Un conflicto/fallo conserva el borrador. Archivos subidos antes de un PUT fallido pueden quedar sin referencia; no se borran automáticamente porque historial/copias podrían necesitarlos.

El frontend guarda un vínculo de archivo separado de la URL local. Al reabrir no descarga todos los binarios: miniaturas usan URL de API y el visor recupera/verifica bytes cuando se abre. Copias locales conservan el vínculo al original remoto; importar no cambia su propietario. El guardado no reemplaza ediciones realizadas mientras se suben archivos.

## Alternativas y consecuencias
Almacenamiento de objetos sería preferible para muchos archivos o despliegue distribuido, pero añadir S3/Supabase y credenciales no ayuda a validar la versión local. Disco más metadatos SQL añade problemas de atomicidad, rutas y backups separados. Bytea permite persistencia atómica de metadatos/binario y un único backup, a costa de aumentar base, WAL y memoria. Reconsiderar al medir volumen; este diseño no es un sistema de almacenamiento público escalable. El límite de 10 MiB ya existe en el frontend; no cambia.

Firmas básicas no equivalen a análisis antimalware ni validación profunda de documentos. PDF aislado y descarga permiten usar el original cuando el navegador no soporte visor. Sin borrado ni limpieza automática de archivos, sin Range/streaming para archivos grandes y sin backups automáticos. Mantener API ligada a loopback hasta disponer de autorización y permisos.
