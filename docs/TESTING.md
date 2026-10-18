# Estrategia incremental de pruebas

## Etapa 2: pruebas entre aplicaciones
`npm test` ejecuta pruebas independientes de apps/api y apps/web. `npm run test:integration` utiliza HTTP NestJS, pool y PostgreSQL reales contra traceboard_test; la configuración rechaza otra base. Verifica creación/listado/apertura, persistencia al recrear API/pool, restricciones SQL, migraciones idempotentes, consultas parametrizadas y errores 400/404/415/503. No elimina registros existentes.

Los E2E de web incluyen creación remota y recuperación desde un contexto vacío, y trabajo local cuando la API está caída. Requieren PostgreSQL/API iniciados y crean registros de demostración en la base de esa API. Usan el puerto 3100 por defecto, o E2E_PORT=3000 para reutilizar un frontend ya activo sin detenerlo. Cada prueba usa un contexto de navegador aislado; no limpia almacenamiento del usuario. El verificador AST ahora recorre apps/web, apps/api y packages/contracts, prohibiendo imports de acceso SQL/backend en frontend y dependencias de UI/infraestructura en contratos.

## Base de Etapa 1
TypeScript estricto y ESLint sin warnings protegen contratos y código. El control AST de dependencias inspecciona imports, reexports, imports dinámicos literales y usos de APIs de navegador en dominio. Tiene ocho pruebas positivas/negativas y rechaza imports computados en la slice. No sustituye revisión de responsabilidades ni demuestra todas las dependencias transitivas de un paquete externo.

## Unitarias
Vitest en entorno Node, sin React ni canvas para reglas del modelo. Comprobar integridad referencial, códigos de requisitos, referencias de archivos, relaciones duplicadas/auto-relaciones, fechas, límites y trazabilidad con ciclos. Al añadir una regla de negocio, incluir ejemplos válidos y casos que deban rechazarse. No exigir porcentajes sin relación con riesgos reales.

## Integración
Ejercitar acciones con el modelo real y el adaptador de persistencia con un almacenamiento en memoria. Verificar que crear/editar/eliminar conserva coherencia, no cambia posiciones indebidamente y que serializar/recuperar conserva el conocimiento. Probar cuota, versiones desconocidas y corrupción sin sobrescritura. Al migrar a IndexedDB o backend, conservar estos escenarios y ejecutar contratos contra el nuevo adaptador.

## End-to-end
Playwright con contexto limpio por prueba, sin tocar investigaciones del usuario. Recorridos actuales: crear/editar/recargar, conexión semántica y evidencias, mover/recargar sin advertencias del editor, selección múltiple y eliminación coherente, nueva investigación, almacenamiento corrupto, conectores mediante arrastre e imagen persistente. El navegador probado es Chrome basado en Chromium; Firefox/WebKit siguen pendientes.

El historial añade pruebas puras de restauración de entidades/relaciones/adjuntos, retención de 50 acciones, viewport actual, ramas de rehacer e aislamiento. En navegador se verifica un arrastre como una sola acción, borrado múltiple reversible y guardado, inspector rehidratado, relaciones reversibles, historial por investigación y atajos de texto independientes. El historial no se serializa; una prueba de recarga confirma que el resultado se conserva y los botones se reinician.

Ampliar según los próximos cambios: edición/eliminación de relaciones, restauración desde exportaciones, fallo de cuota visible, archivos PDF, navegación solo por teclado, táctil y recuperación de borradores. Pruebas de rendimiento cuando haya un volumen de investigación representativo; no añadir benchmarks sintéticos ahora.

## Flujo por implementación
1. Elegir una prueba según comportamiento/riesgo, antes de ampliar la funcionalidad.
2. Ejecutar tipos, lint, arquitectura, pruebas relacionadas y build. Ejecutar E2E al modificar interacción/persistencia.
3. Revisar visualmente cuando cambie el layout. No borrar almacenamiento del usuario para obtener una captura limpia: crear un contexto aislado.
4. Documentar aprobados, fallidos y pendientes con comandos reales. Corregir errores o declarar la limitación; no sustituir una prueba fallida por una afirmación.

CI pendiente hasta que exista un repositorio remoto: instalar con npm ci, ejecutar controles estáticos/unitarios/build y luego E2E con Chromium. No conectar servicios externos sin que sea parte del alcance.
## Incremento de tableros remotos

Unitarias: integridad de grafo, proyección sin binarios, conservación de borrador, huella canónica e historial conservando revisión. Integración con traceboard_test: recuperación tras recrear API/pool, reemplazo completo indivisible, dos PUT simultáneos con un 409, grafo inválido que no altera datos, exclusión de URLs/base64 y límites 413/415. E2E: documento → hallazgo → requisito y navegación a evidencia en sesión nueva, conflicto conservando copia y fallo remoto con recuperación local.

Para aislar también E2E, iniciar API temporal con DATABASE_URL de traceboard_test y PORT=4100, compilar frontend con TRACEBOARD_API_URL=http://127.0.0.1:4100 y servir en 3100. Playwright reutiliza ese servidor; después detener solamente esos procesos temporales y recompilar con configuración habitual. No imprimir credenciales ni detener los servidores del usuario. Un build habitual usa API 4000. Cada test crea datos propios; no elimina registros existentes.

## Incremento de archivos remotos
Unitarias: firma/extensión/MIME, nombres sin rutas, 10 MiB exactos, hash y confirmación de subida, originales locales conservados y backend caído. Integración real: deduplicación, recuperación exacta tras reiniciar API/pool, ownership entre investigaciones y metadatos/hash coherentes, 413/415/400/404, PDF y 10 MiB exactos. Comparar binarios grandes con Buffer.equals, no igualdad genérica por millones de propiedades. E2E: imagen/PDF abiertos y descargados desde contexto nuevo con bytes idénticos; subida fallida con copia local; archivo no disponible sin pérdida de tarjeta; edición durante subida seguida de segundo guardado sin resubir el original. Mantener regresiones de tablero e historial.
