# Reglas de ingeniería de TraceBoard

## Alcance y arquitectura
- Leer la especificación, docs/ARCHITECTURE.md y los ADR antes de cambiar límites o tecnología.
- Organizar por funcionalidades; crear capas solo con responsabilidades reales. El dominio es TypeScript independiente de React, Next.js, React Flow/tldraw, DOM, red y persistencia.
- Los casos de uso dependen del dominio; infraestructura adapta almacenamiento y presentación adapta el canvas. No importar infraestructura desde dominio/aplicación.
- Consumir otros módulos mediante su API pública. No duplicar entidades como estado del editor: separar conocimiento, posiciones y viewport.
- Conservar archivos y cambios del usuario. Justificar refactorizaciones grandes y solicitar autorización para acciones destructivas fuera del alcance.
- Evitar abstracciones anticipadas, contenedores DI, eventos globales y capas vacías. No añadir backend, autenticación o IA durante Etapa 1.
- Al comenzar Etapa 2, separar frontend y backend en apps/web y apps/api, con configuración, ejecución y build independientes. El frontend consume la API: no importa código del backend ni accede a la base de datos. packages/contracts solo contiene contratos de comunicación cuando existan consumidores reales, nunca componentes o repositorios. No trasladar todo el proyecto antes de que esa etapa lo requiera.

## Código, seguridad y UX
- TypeScript estricto; no usar any, ts-ignore o casts para omitir validación de entradas.
- Validar almacenamiento y archivos en ejecución; aplicar límites de tamaño/tipo, integridad referencial y mensajes útiles. No ejecutar contenido de documentos ni renderizar HTML no confiable.
- No incluir credenciales. Evitar registrar datos de investigaciones. Mantener dependencias reproducibles con package-lock.json.
- Antes de commit/push ejecutar check:secrets y revisar el inventario Git. No versionar bases, documentos reales, exportaciones de usuarios ni capturas; usar datos ficticios en pruebas. Los ejemplos de entorno contienen marcadores, no contraseñas. No publicar tokens en URLs ni usar force push para sobrescribir cambios ajenos.
- Gestionar carga, vacío, error y fallos de guardado sin simular éxito. No sobrescribir automáticamente almacenamiento corrupto.
- Controles reales con nombres accesibles, foco visible, teclado y diseño adaptable. No botones decorativos que aparenten capacidades inexistentes.

## Calidad verificable
- Antes de entregar ejecutar npm run typecheck, npm run lint, npm run test, npm run check:architecture y npm run build.
- Pruebas unitarias para integridad/reglas; integración para acciones y persistencia; E2E para recorridos críticos. No tests de implementación ni porcentajes de cobertura arbitrarios.
- Registrar cada criterio como aprobado/fallido/pendiente: independencia del dominio, responsabilidad de módulos, patrones justificados, comportamiento probado, calidad automatizada, mantenibilidad y seguridad/datos.
- Cada hallazgo incluye evidencia, impacto y severidad P0–P3; distinguir defecto confirmado de riesgo pendiente.
- Nunca declarar completo un trabajo con verificaciones requeridas fallidas o no ejecutadas. Reportar comandos y resultados reales, incluyendo límites de revisión manual/E2E.
- Usar los skills traceboard-development y traceboard-architecture-review cuando correspondan. Un revisor independiente requiere autorización para delegar; no inventar su aprobación.
