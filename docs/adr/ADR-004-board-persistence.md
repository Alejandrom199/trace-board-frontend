# ADR-004: guardado de tableros con control de versiones

- Fecha: 2026-10-13
- Estado: aceptada para el segundo incremento de Etapa 2

## Contexto y alcance
Guardar y recuperar tarjetas, relaciones, posiciones, viewport y metadatos de archivos desde otra sesión. Los binarios siguen locales; no introducir autenticación, colaboración ni almacenamiento de archivos en esta entrega.

## Decisión
GET/PUT `/api/investigations/:id/board` intercambian un snapshot validado de una investigación, sin URLs ni base64. Una columna JSONB y una revisión entera en la fila existente permiten actualizar todo el grafo de forma atómica. PUT incluye la revisión leída; UPDATE condicionado por esa revisión impide sobrescribir cambios concurrentes (409). La investigación recién creada empieza en revisión 0, sin contenido remoto.

El usuario pulsa Guardar en base de datos; IndexedDB mantiene el autoguardado del borrador. Un error remoto nunca anuncia éxito. Reabrir contenido remoto conserva un borrador local diferente como investigación independiente, sin vínculo remoto. La revisión y huella del último contenido confirmado se guardan localmente; no forman parte de deshacer/rehacer. No sincronizar pestañas automáticamente.

Validar límites, IDs únicos, requisitos, posiciones y referencias antes de escribir. Limitar el cuerpo HTTP a 8 MiB. Las migraciones son aditivas; no borrar investigaciones o copias locales existentes.

## Alternativas y consecuencias
Tablas por tarjeta/relación darían mejores consultas e integridad SQL por arista, pero ahora solo se carga/guarda un tablero completo de hasta 500 tarjetas y 2000 relaciones. JSONB mantiene las operaciones pequeñas y el guardado indivisible; la integridad interna del grafo depende de validación de API y no debe escribirse directamente por SQL. Reconsiderar normalización cuando existan consultas entre investigaciones o colaboración; migrar snapshots sin pérdida.

Posponer Prisma: introducir un ORM para actualizar una fila no aporta valor suficiente. Un autoguardado remoto exigiría reintentos, resolución de conflictos y recuperación más complejos. Guardado explícito ofrece un comportamiento comprobable; no resuelve conflictos automáticamente. Metadatos de adjuntos recuperados en otra sesión no incluyen el archivo original y la UI debe indicarlo.
