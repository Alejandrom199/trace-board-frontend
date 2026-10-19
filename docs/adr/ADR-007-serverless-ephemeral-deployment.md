# ADR-007: despliegue serverless sin base de datos

- Fecha: 2026-10-18
- Estado: aceptada por instrucción del usuario.

## Contexto

TraceBoard debe ejecutarse con el frontend en Netlify y la API en Railway, sin aprovisionar PostgreSQL. Railway ofrece Serverless mediante suspensión por inactividad de un contenedor. La instancia puede reiniciarse, suspenderse o cambiar, por lo que su memoria no es persistencia durable. El navegador ya conserva el tablero en IndexedDB.

## Decisión

La API admite `TRACEBOARD_STORAGE=memory` con adaptadores en memoria para investigaciones, revisiones y archivos. El dominio y los casos de uso conservan los mismos puertos; PostgreSQL sigue disponible para desarrollo o una etapa futura. Railway ejecuta una réplica, habilita Serverless y comprueba `/api/health`.

Netlify sirve Next.js y expone un Route Handler bajo `/api/investigations`. Este proxy lee `TRACEBOARD_API_URL` y `TRACEBOARD_API_TOKEN` solo en el servidor, añade el token al llamar a Railway y nunca lo entrega al navegador. Railway exige ese token en producción. Ambos proveedores reciben el mismo valor mediante variables protegidas, nunca mediante Git.

## Alternativas

- PostgreSQL administrado: ofrece durabilidad, pero contradice el alcance sin base de datos.
- Solo IndexedDB, sin API: reduce infraestructura, pero no cumple el despliegue solicitado del backend.
- API pública sin token: es más simple, pero permite abuso del almacenamiento y operaciones anónimas directas.

## Consecuencias

- El tablero local es la fuente durable de esta versión.
- Investigaciones y archivos remotos desaparecen cuando Railway reinicia, suspende, reemplaza o escala la instancia.
- El primer acceso tras suspensión puede tener arranque en frío e incluso requerir reintento.
- Se limita la memoria a 500 investigaciones y 50 MiB de archivos por instancia.
- No se debe aumentar a varias réplicas mientras el adaptador en memoria sea el modo activo.
- Una futura persistencia durable puede volver a seleccionar PostgreSQL sin cambiar dominio ni contratos HTTP.
