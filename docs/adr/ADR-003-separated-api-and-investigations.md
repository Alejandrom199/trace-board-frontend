# ADR-003: aplicaciones separadas y persistencia de investigaciones

- Fecha: 2026-10-13
- Estado: aceptada para el primer incremento de Etapa 2

## Contexto
El usuario aprobó Etapa 2 y exigió separación de backend y frontend. El prototipo Next.js ya tiene un canvas y guardado local que deben conservarse. El primer entregable acordado es crear una investigación, guardarla en una base de datos y reabrirla; la persistencia de tarjetas/relaciones vendrá después.

## Decisión
- npm workspaces: apps/web (Next.js), apps/api (NestJS) y packages/contracts (DTO/esquemas de comunicación). Builds, ejecución y dependencias de cada aplicación separados. El frontend no importa código de API ni SQL.
- Migración de los fuentes/configuración/tests del frontend a apps/web, conservando su contenido y las rutas de datos del navegador. Documentación, skills y control de arquitectura quedan en raíz. No borrar archivos generados ni datos existentes.
- API HTTP con POST/GET /api/investigations y GET /api/investigations/:id. Validación de entradas y respuestas; errores 400/404/503 explícitos.
- Dominio y casos de uso de API sin NestJS o PostgreSQL. Un puerto de repositorio, un adaptador PostgreSQL y composición NestJS.
- PostgreSQL real y migraciones SQL versionadas, con node-postgres y consultas parametrizadas/pool acotado. Prisma era una propuesta de la especificación; se pospone porque este incremento necesita una tabla y tres consultas, sin un modelo relacional complejo que justifique generación de ORM. Reconsiderar al persistir nodos/relaciones.
- Clave interna bigint identity y UUID público único. Fechas timestamptz, límites y CHECKs de nombre/descripcion, índice para listado estable. Una instancia local dedicada en .local, puerto 55432, roles separados de administrador/aplicación y credenciales ignoradas por Git. No reutilizar bases existentes del usuario.
- Sección de investigaciones de base de datos en el explorador, separada de las locales. Abrir desde API combina metadatos recuperados con el contenido local de ese tablero si existe. La UI explica que las tarjetas todavía se guardan localmente; no anunciar guardado remoto de contenido que aún no se persiste.
- API de desarrollo ligada a 127.0.0.1, sin autenticación/IA. No publicar este servicio sin definir acceso.

## Alternativas
- Backend en rutas Next.js: contradice la separación solicitada.
- SQLite o repositorio en memoria: no cumplen el incremento acordado de PostgreSQL real; memoria solo en pruebas unitarias.
- Persistir todo el workspace como JSONB: rápido, pero oculta límites y no es necesario para este recorrido. No subir adjuntos/base64 al backend en este incremento.
- Migrar toda la plataforma/introducir autenticación: excede el alcance y dificulta validar el primer recorrido.

## Consecuencias
Crear una investigación no depende del navegador y puede recuperarse desde otra sesión mediante API. El prototipo local se mantiene utilizable incluso cuando API no está disponible, con errores visibles. Se requiere iniciar PostgreSQL/API/web para el recorrido remoto. La migración es organizativa; no hay refactorización masiva del canvas. El siguiente incremento debe persistir tableros/nodos/relaciones y definir concurrencia antes de considerar la base de datos fuente única de toda la investigación.
