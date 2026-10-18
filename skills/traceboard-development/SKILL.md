---
name: traceboard-development
description: Implementar cambios solicitados en TraceBoard con arquitectura por funcionalidades, dominio independiente y calidad verificable. Usar al desarrollar, corregir o configurar TraceBoard; para una auditoría sin implementación usar traceboard-architecture-review.
---

# Desarrollo de TraceBoard

Trabajar sobre el alcance solicitado. Una tarea de gobernanza autoriza documentación y configuración mínima, no funcionalidades nuevas ni una migración completa.

## Contexto y decisiones

- Antes de editar, localizar el código real, las instrucciones AGENTS.md aplicables, el estado de Git, las versiones y los comandos disponibles. Si solo hay documentación o skills, no tratarlo como una aplicación existente; solicitar la ruta y continuar únicamente el trabajo independiente del código.
- Leer docs/ARCHITECTURE.md y los ADR existentes cuando estén presentes. Distinguir la arquitectura actual de la propuesta; no considerar que el código cumple por tener carpetas con nombres de capas.
- Organizar cambios por funcionalidades (Vertical Slices). Separar dominio, aplicación/casos de uso, presentación e infraestructura solo donde exista responsabilidad concreta. Mantener rutas de Next.js como composición y adaptación cuando ese framework esté presente.
- El dominio no debe importar React, Next.js, tldraw, SDK de almacenamiento ni acceder a DOM, red, variables de entorno o persistencia. Modelar únicamente reglas y conceptos del producto con TypeScript independiente. Encapsular tipos de tldraw fuera del dominio.
- Los casos de uso dependen del dominio y de los contratos que necesitan; los adaptadores de infraestructura implementan esos contratos. Conectar implementaciones en el punto de composición, evitando que el dominio o los casos de uso importen adaptadores concretos.
- Consumir otros módulos por contratos públicos explícitos. Evitar imports de sus detalles internos. Extraer código compartido únicamente cuando existan consumidores reales; no convertir shared en un depósito de lógica del producto.
- Justificar nuevas interfaces, repositorios, servicios o patrones mediante un problema concreto. No introducir contenedores de inyección, buses de eventos o capas vacías por anticipación.

## Implementación y comprobaciones

Hacer cambios localizados y reversibles. Explicar alcance y estrategia antes de una refactorización extensa o destructiva; solicitar autorización si supera la tarea. No sobrescribir cambios del usuario.

Usar TypeScript estricto; validar datos externos en ejecución, sin sustituir validación por casts. Tratar importaciones, archivos y datos persistidos como entradas no confiables: validar estructura y límites adecuados, gestionar fallos y evitar revelar secretos o contenido sensible en errores y logs.

Añadir pruebas proporcionales al comportamiento: unitarias para reglas de dominio, integración para casos de uso y adaptadores, y E2E para recorridos críticos. Priorizar pérdida de datos, carga/guardado e importación/exportación si esas capacidades existen. No afirmar que están implementadas sin inspeccionarlas. Evitar tests que solo repitan la implementación o snapshots sin una señal útil.

Ejecutar las verificaciones disponibles relacionadas con el cambio, incluyendo typecheck, lint, límites arquitectónicos, pruebas y build cuando estén configurados. Consultar los scripts reales antes de elegir comandos; no inventarlos ni silenciar fallos para obtener un estado verde. Si falta una comprobación, informar la ausencia y configurarla únicamente cuando sea parte del alcance.

## Criterios de aceptación

Para cada criterio registrar aprobado, fallido o pendiente, con evidencia concreta:

- **Arquitectura y dependencias:** dominio independiente de UI e infraestructura; comprobación automatizada de imports cuando exista y revisión de sus límites.
- **Responsabilidad de módulos:** propósito y contratos identificables; cambios ubicados en la funcionalidad responsable.
- **Patrones justificados:** cada abstracción nueva tiene una necesidad demostrable.
- **Pruebas y comportamiento:** cobertura del comportamiento crítico afectado y resultados reales de ejecución.
- **Calidad automatizada:** resultados de typecheck, lint y build; incluir verificación arquitectónica si está configurada.
- **Mantenibilidad:** el cambio se concentra en los módulos responsables; explicar cambios transversales necesarios.
- **Seguridad y datos:** entradas externas validadas, archivos controlados y errores gestionados en el alcance afectado.

Una excepción necesita motivo, alcance y seguimiento explícitos; no se convierte en aprobación. No declarar terminado un cambio con comprobaciones requeridas fallidas o sin ejecutar. Reportar qué se cambió, resultados, limitaciones y riesgos pendientes. Si se solicita revisión independiente, entregar al revisor el alcance, los artefactos y los comandos; no atribuir aprobación a una revisión inexistente ni iniciar agentes adicionales sin autorización.
