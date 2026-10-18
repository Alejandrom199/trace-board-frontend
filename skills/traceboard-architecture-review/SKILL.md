---
name: traceboard-architecture-review
description: Revisar arquitectura, dependencias, seguridad, pruebas y mantenibilidad de TraceBoard con hallazgos verificables y severidad. Usar para auditar el proyecto o revisar cambios; no implementar funcionalidades ni refactorizaciones durante una revisión salvo petición explícita.
---

# Revisión arquitectónica y de calidad de TraceBoard

Evaluar el código y el comportamiento con evidencia. No asumir que una arquitectura documentada o una verificación aprobada garantiza la corrección del sistema.

## Alcance y evidencia

- Identificar si se revisa el proyecto completo o un diff. Leer AGENTS.md, docs/ARCHITECTURE.md y los ADR cuando existan; respetar las instrucciones aplicables y la petición actual.
- Verificar que hay código fuente real. Si la ubicación está vacía o contiene únicamente documentación/skills, solicitar el repositorio y no inventar hallazgos, módulos, vulnerabilidades ni resultados de pruebas.
- Inspeccionar imports, puntos de composición, flujos de datos y responsabilidades. Revisar los scripts y la configuración de TypeScript, lint, pruebas y controles de dependencias, no solo su existencia.
- No modificar el código en una revisión salvo que se haya pedido corregirlo. Ejecutar verificaciones locales pertinentes cuando existan; evitar conexiones a producción o efectos externos fuera del alcance autorizado.

## Lista de revisión

Para cada criterio indicar aprobado, fallido o pendiente. Citar archivos y líneas verificadas cuando haya un hallazgo; para comandos registrar resultado real y errores relevantes.

1. **Arquitectura y dependencias.** El dominio no importa React, Next.js, tldraw ni persistencia, ni accede a DOM, red o entorno. Los casos de uso dependen del dominio y de contratos, no de adaptadores concretos. Verificar también reexports, imports dinámicos y dependencias transitivas relevantes. Los módulos consumen contratos públicos y no detalles internos ajenos.
2. **Responsabilidad de módulos.** Las funcionalidades tienen propósito y límites comprensibles. Distinguir presentación, reglas de producto, orquestación y acceso a datos donde corresponda. Detectar ciclos y concentraciones de responsabilidades; evitar imponer capas vacías.
3. **Patrones justificados.** Las abstracciones tienen consumidores y una necesidad concreta. Evaluar si DDD y Clean Architecture reducen acoplamiento en ese caso. No pedir patrones empresariales por preferencia estética.
4. **Pruebas y comportamiento.** Examinar aserciones y fallos, además del número de tests. Buscar pruebas sobre reglas, límites y flujos críticos afectados, incluyendo persistencia/importación si existen. Diferenciar pruebas unitarias, integración y E2E. Un test en verde no demuestra comportamientos que no comprueba.
5. **Calidad automatizada.** Ejecutar typecheck, lint, build y verificaciones de arquitectura/pruebas disponibles usando los comandos reales del repositorio. Revisar exclusiones, supresiones y alcance de las herramientas. Documentar comprobaciones ausentes, fallidas o no ejecutables sin marcarlas como aprobadas.
6. **Mantenibilidad.** Examinar si una modificación queda localizada; detectar duplicación de reglas, módulos compartidos con responsabilidades del producto y acoplamiento a tipos de proveedores. Proponer migraciones incrementales, con un primer paso verificable.
7. **Seguridad y datos.** Revisar validación de entradas externas, límites de archivos, tratamiento de datos persistidos, manejo de errores y exposición de secretos donde aplique. Identificar pérdida/corrupción de datos y permisos defectuosos mediante un escenario concreto. Separar defectos demostrados de riesgos que requieren investigación.

## Hallazgos y prioridades

Clasificar cada hallazgo por impacto y condiciones de activación:

- **Crítica / P0:** exposición o pérdida grave de datos, o indisponibilidad general demostrada que exige intervención inmediata.
- **Alta / P1:** defecto concreto en un flujo crítico, integridad o seguridad; priorizar antes de ampliar esa funcionalidad.
- **Media / P2:** acoplamiento, ausencia de controles o riesgo reproducible que perjudica cambios y confiabilidad; corregir de forma incremental.
- **Baja / P3:** mejora localizada de claridad o consistencia sin impacto inmediato demostrado.

No elevar severidad por falta de tests, por tamaño de archivo o por incumplir un patrón sin evaluar el impacto. No etiquetar una vulnerabilidad como confirmada si solo es una hipótesis. Para cada hallazgo incluir evidencia, escenario/impacto y recomendación mínima. Evitar recomendaciones vagas como «aplicar SOLID».

## Entrega

Presentar primero problemas accionables y resultados de las comprobaciones. Si no hay hallazgos, decirlo e indicar límites de la revisión. Para una auditoría de gobernanza, incluir arquitectura actual y propuesta, problemas por severidad, reglas/control existentes o faltantes, verificaciones realizadas, riesgos pendientes y recomendaciones priorizadas.

No declarar revisión completa si faltan comprobaciones requeridas: indicar revisión parcial y el impedimento. Mantener separado lo observado, lo propuesto y lo ya configurado. Cuando se autorice trabajar con desarrollador y revisor, revisar los artefactos y resultados de manera independiente y devolver hallazgos; no considerar el informe del desarrollador evidencia suficiente por sí solo ni crear agentes adicionales sin autorización.
