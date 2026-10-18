# ADR-001: prototipo por funcionalidades con dominio independiente

- Fecha: 2026-10-13
- Estado: aceptada para Etapa 1

## Contexto
La especificación requiere investigar mediante tarjetas multimedia y relaciones semánticas, con Next.js/React/TypeScript, sin backend, autenticación ni IA. El proyecto inicial solo contiene skills. El conocimiento debe sobrevivir a cambios de motor de canvas y no depender de posiciones visuales.

## Decisiones
1. Una vertical slice `investigation`, con dominio, acciones de aplicación, adaptadores y presentación. No módulos o interfaces sin consumidores reales.
2. React Flow para zoom/paneo, selección, nodos personalizados y conectores tipificados. React Flow es MIT; tldraw requiere clave de licencia para producción. Fuentes consultadas: https://reactflow.dev/ y https://tldraw.dev/community/license (2026-10-13).
3. Dominio y posiciones separados; IDs del editor solo en la proyección. Zod valida el formato local e integridad referencial.
4. localStorage con formato versionado y límites de adjuntos para la demostración. No sustituye almacenamiento durable; informar cuota y datos inválidos. Exportar JSON ofrece copia manual.
5. Estado React suficiente para una slice. TypeScript estricto, ESLint, Vitest y comprobación AST de límites. E2E incremental con Playwright.

## Alternativas
- tldraw: mejor para dibujo libre y herramientas de pizarra; más adaptación para un grafo semántico y licencia de producción. Reconsiderar si dibujo libre se convierte en requisito central.
- Canvas propio: excesivo trabajo de navegación, selección, conectores y accesibilidad.
- Capas globales y repositorios genéricos: dispersan cada funcionalidad y anticipan infraestructura inexistente.
- Backend/PostgreSQL o IndexedDB desde el inicio: mejores capacidades de persistencia; fuera del objetivo inmediato. IndexedDB será preferible para muchos archivos/binarios.
- Zustand: válido para múltiples consumidores complejos; innecesario para el estado de este prototipo.

## Consecuencias
Las tarjetas y flechas tienen un modelo independiente y reglas comprobables. Se usa React Flow para la interacción, no como fuente única del conocimiento. No se incluyen dibujo libre, colaboración ni recuperación remota. localStorage tiene cuota y se borra al eliminar datos del navegador. La validación debe impedir referencias huérfanas y evitar borrar datos corruptos silenciosamente. Las migraciones futuras requieren conversión versionada y pruebas, no reemplazo destructivo de datos.
