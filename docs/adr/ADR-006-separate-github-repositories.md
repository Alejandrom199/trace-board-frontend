# ADR-006: publicación en repositorios Git separados

- Fecha: 2026-10-13
- Estado: aceptada por instrucción del usuario.

## Contexto y decisión

El usuario proporciona trace-board-frontend y trace-board-backend como destinos. El workspace actual conserva ambas aplicaciones y los datos locales. Se preparan copias por lista explícita de archivos en `.local/github/frontend` y `.local/github/backend`, sin mover ni borrar el proyecto en uso.

Cada repositorio contiene solo su aplicación (`apps/web` o `apps/api`), un workspace `packages/contracts` y sus herramientas/documentación. Mantener las rutas existentes evita refactorizaciones de imports, migraciones y configuración. Sus package.json, lockfile, instalación, calidad y build son independientes. La comunicación entre aplicaciones sigue siendo HTTP.

Los contratos son el mismo snapshot de TypeScript/Zod en ambos repositorios, con huella SHA-256 de texto UTF-8/LF normalizado en `contracts-manifest.json` para funcionar en Windows y Linux. No se publica un paquete npm todavía. Cambiar la comunicación requiere sincronizar el contrato en ambos destinos y comprobar compatibilidad; no compartir UI, repositorios ni modelos ORM. Cada CI valida su snapshot; no consulta automáticamente el otro repositorio.

## Alternativas y consecuencias

Un único monorepo simplifica cambios coordinados, pero el usuario pidió dos repositorios. Publicar el contrato en npm o usar un tercer repositorio/submódulo añade acceso, versiones y distribución aún innecesarios. Copiar el contrato tiene riesgo de divergencia: documentar su actualización, comprobar la huella común antes de publicar y versionar cambios incompatibles.

No publicar `.local`, bases, credenciales, `.env`, documentos de investigación, exportaciones reales, capturas de usuarios, builds ni dependencias. Los E2E de lectura de flujo usan datos ficticios autocontenidos. El control local de secretos y el CI revisan los archivos publicables; no garantizan detectar todo secreto ni reemplazan revisión humana. Subir código no despliega una API pública; autenticación y autorización permanecen pendientes.
