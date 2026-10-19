# ADR-008: modelo de entidades para análisis de negocio y requisitos

- Fecha: 2026-10-19
- Estado: aceptada por instrucción del usuario.

## Contexto
El modelo tenía seis tipos de tarjeta (nota, documento, imagen, hallazgo, requisito, proceso). La especificación pide además actores, problemas y reglas de negocio, y el modo de ingeniería estructurada necesita preguntas, decisiones, sistemas externos y requisitos no funcionales. Sin ellos, el análisis se registraba en notas sin estructura y no podía filtrarse ni trazarse.

## Decisión
- Seis tipos nuevos: `problem`, `question`, `actor`, `business_rule`, `external_system`, `decision`.
- Cada tipo con atributos tiene una propiedad propia, opcional en el esquema pero obligatoria para su tipo y prohibida para los demás: `requirement`, `actor` (usuario, interesado, área), `problem` (severidad y estado), `businessRule` (código), `question` (estado y respuesta) y `decision` (código, estado y justificación). `external_system` no tiene atributos.
- El requisito añade `type` (`functional` o `non_functional`). Solo los no funcionales llevan `category`, con las características de ISO/IEC 25010.
- Prefijos de código: RF, RNF, RN y DEC. La unicidad se comprueba entre todos los tipos codificados, sin distinguir mayúsculas. Cambiar entre RF y RNF renumera solo los códigos con formato automático.
- Dos relaciones nuevas: `performs` (Ejecuta) y `answers` (Responde). No se restringe qué relaciones admite cada par de tipos, para conservar la investigación libre.
- La creación se agrupa en Fuentes, Análisis, Negocio y Solución.

## Compatibilidad
- Un requisito sin `type` se interpreta como funcional, tanto en el dominio como en el contrato. Las investigaciones locales, las exportaciones JSON y el contenido remoto anteriores se leen sin migración.
- El contrato pasa a 0.2.0. El backend debe desplegarse antes que el frontend: el contrato 0.1.0 rechaza los tipos nuevos.

## Alternativas
- Un único `data: Record<string, unknown>` por tarjeta: más flexible, pero sin validación por tipo ni tipado.
- Una matriz de relaciones permitidas por par de tipos: evita combinaciones absurdas, pero contradice el modo de investigación libre. Queda como sugerencia de relación, no como restricción.

## Consecuencias
- Los datos de ejemplo incluyen un actor, un problema, una regla y una pregunta.
- El frontend y el backend repiten la regla de atributos por tipo, como ya ocurría con los requisitos. Ambas copias tienen pruebas.
- El panel de salud del análisis, la matriz de trazabilidad y los flujos con pasos pueden apoyarse en estos tipos.
