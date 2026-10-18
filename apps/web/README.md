# TraceBoard web

Frontend Next.js, React y canvas. No importa código de `apps/api` ni accede a PostgreSQL. El navegador consume `/api/investigations`; el servidor Next.js lo reenvía a la API configurada en `TRACEBOARD_API_URL`, por defecto http://127.0.0.1:4000.

Desde la raíz, `npm run dev`. Abre http://127.0.0.1:3000. Para el recorrido de base de datos, inicia además PostgreSQL y API según el README raíz.

El explorador distingue investigaciones locales y de base de datos. Crear en base de datos guarda metadatos mediante POST; abrir consulta GET /api/investigations/:id/board. Guardar en base de datos usa PUT con revisión esperada. Se recuperan tarjetas, relaciones, posiciones, viewport y metadatos de archivos, sin binarios/URLs. Un borrador local diferente se conserva como copia independiente antes de reabrir; deshacer no revierte la revisión remota y abrir reinicia el historial de ese tablero. Las copias importadas no conservan vínculos de sincronización.

Antes del PUT, remote-files.ts sube PDF/imágenes pendientes por HTTP; conserva data URLs locales y añade un vínculo remoteFile separado. La respuesta del guardado no reemplaza ediciones realizadas durante la subida. Una sesión nueva recupera vínculos, muestra miniaturas desde API y descarga/verifica el original al abrir el visor. Blob URLs se revocan al cerrar/cambiar archivo. Fallos muestran carga/error, manteniendo tarjeta y borrador. Office y recursos de ejemplo sin originales quedan como metadatos. Copias locales pueden seguir consultando originales de su investigación de origen; al subirlas a otra investigación los bytes deben copiarse, no vincular un archivo ajeno.

El canvas, IndexedDB y el historial por sesión se conservan. El origen del navegador determina los datos locales: usa el mismo host/puerto que antes. Después de la migración de carpetas, reinicia el frontend anterior con los comandos nuevos para que se ejecute desde `apps/web`.

Comandos independientes: `npm run build`, `npm run lint -w @traceboard/web`, `npm run test -w @traceboard/web`. E2E: `npm run test:e2e`; usan puerto 3100 por defecto. Si ya hay un frontend de este proyecto activo en 3000, define `E2E_PORT=3000` para reutilizarlo sin detenerlo. Los tests usan contextos de navegador aislados. Los E2E remotos requieren API/PostgreSQL iniciados y crean registros de demostración en la base configurada de esa API; no borran registros. Las pruebas de integración de API usan traceboard_test.
