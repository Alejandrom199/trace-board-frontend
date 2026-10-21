# ADR-009: generación de flujo con IA gratuita de Hugging Face

- Fecha: 2026-10-20
- Estado: aceptada por instrucción del usuario; sustituye la exclusión de IA de ADR-001/ADR-007 y del README para esta capacidad concreta.

## Contexto

TraceBoard registraba el flujo de negocio a mano, tarjeta por tarjeta. El usuario pidió una ayuda de IA gratuita (Hugging Face) que, a partir de un documento subido (acta, manual, entrevista), proponga actores, procesos y reglas de negocio para no partir de cero. Hasta ahora el proyecto declaraba explícitamente "sin IA"; esta decisión la incorpora de forma acotada, sin tocar autenticación, persistencia remota ni el resto del alcance.

## Decisión

- Nuevo feature `apps/api/src/features/ai-flow`, independiente de `investigations`: no conoce el dominio de investigaciones ni persiste nada. Es una transformación sin estado: documento → texto → modelo → flujo propuesto validado. La revisión y el alta en el tablero ocurren enteramente en el cliente, igual que crear una tarjeta a mano.
- `POST /api/ai/generate-flow` recibe los bytes del documento (igual convención que la subida de archivos: `application/octet-stream` + `X-File-Name` + `X-File-Mime`) y devuelve `{ flow: { entities, relations }, truncated }` validado por `packages/contracts`. Protegido por el mismo `TRACEBOARD_API_TOKEN` que el resto de la API.
- Alcance de documentos en esta etapa: **solo texto extraíble** — PDF con texto (vía `pdf-parse`) y `.txt`/`.md`, hasta 10 MB y 20000 caracteres de extracto. Sin OCR de imágenes ni de escaneos: queda para una iteración posterior si se confirma que hace falta.
- El modelo de lenguaje es Hugging Face Inference Providers (capa gratuita), vía el endpoint compatible con chat completions. Es configurable con `HF_MODEL` porque qué modelo concreto está disponible gratis cambia con el tiempo; sin `HF_API_TOKEN` configurado, el resto de la API sigue funcionando y este endpoint responde 503.
- El flujo propuesto se revisa antes de aplicarse: el frontend muestra cada entidad propuesta con una casilla (todas marcadas por defecto) y solo crea relaciones cuyos dos extremos fueron aceptados. Aplicar usa los mismos valores por defecto y validaciones que crear una tarjeta a mano (`application/actions.ts`), se registra como una sola acción de deshacer/rehacer, y coloca las tarjetas nuevas debajo de las existentes en una cuadrícula simple.
- Las relaciones marcadas por el modelo como secuencia de proceso usan `metadata.categoria=flujo`, reutilizando la proyección ortogonal que el canvas ya aplica a esa categoría.
- Netlify/Railway: el proxy `/api/ai/*` en Next.js sigue el mismo patrón que `/api/investigations/*` (token añadido solo en el servidor); ambos comparten ahora la lógica de proxy en `apps/web/src/app/api/http-proxy.ts`.

## Alternativas

- Aplicar el flujo propuesto directamente al tablero sin revisión: más simple, pero un modelo gratuito puede alucinar entidades o relaciones; se descartó por el riesgo de ensuciar el tablero sin control explícito del usuario.
- OCR de imágenes/escaneos desde el inicio: amplía cobertura, pero añade latencia, dependencia de otro modelo y más puntos de fallo del nivel gratuito; se deja para una decisión posterior si la sola extracción de texto resulta insuficiente en uso real.
- Ejecutar un modelo local (transformers.js) en el navegador: evita depender de un servicio externo, pero los modelos con calidad suficiente para esta tarea no son prácticos para ejecutar en el cliente sin servidor dedicado.

## Consecuencias

- La disponibilidad de modelos gratuitos de Hugging Face puede cambiar; `HF_MODEL` permite ajustar sin tocar código, pero puede requerir reconfiguración ocasional.
- El flujo generado depende de la calidad del extracto de texto; documentos PDF escaneados (solo imagen) no producen una propuesta útil en esta etapa.
- El endpoint es una dependencia externa adicional: timeouts o caídas de Hugging Face devuelven un error controlado (502) sin afectar al resto de la aplicación ni al almacenamiento local.
- `packages/contracts` sube los tipos compartidos de la propuesta de IA; cualquier cambio de forma debe sincronizar API y frontend, igual que el resto de contratos.
- Brecha conocida frente a la especificación original (línea "toda sugerencia de IA debe conservar la referencia a su fuente"): el documento subido para generar el flujo no queda como tarjeta de origen ni se crean relaciones `evidences` automáticas hacia él. El modelo local de archivos solo admite PDF/imagen como adjunto real; incorporar `.txt`/`.md` como fuente persistida es una ampliación pendiente, no incluida en esta decisión.
