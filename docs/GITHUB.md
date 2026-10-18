# Publicar y actualizar TraceBoard

Destinos indicados por el usuario:

- https://github.com/Alejandrom199/trace-board-frontend
- https://github.com/Alejandrom199/trace-board-backend

Este workspace conserva el proyecto y datos originales. `scripts/prepare-github.mjs frontend` y `scripts/prepare-github.mjs backend` copian exclusivamente fuentes/configuración autorizados a `.local/github/<destino>`. Requieren un clon existente y no sobrescriben archivos previamente distintos: usa `--refresh` de forma explícita para actualizar los archivos generados desde este workspace. No eliminan archivos del clon ni investigaciones.

Cada entrega mantiene una sola aplicación bajo apps y su copia idéntica de packages/contracts. Instalar con npm ci desde la raíz de cada clon; frontend y backend se inician desde terminales independientes. La huella contracts-manifest.json debe coincidir en las dos entregas cuando se publique un cambio de contrato. Ver ADR-006.

## Archivos excluidos

`.local`, `.env` salvo ejemplos con marcadores, claves/certificados privados, bases y dumps, node_modules, dist, .next, resultados de tests, logs, docs/vector-precios y docs/screenshots. Se conservan en el equipo. Los tests publicados usan datos ficticios. La especificación del producto y sus ADR son documentación de código, no las investigaciones de usuarios.

`npm run check:secrets` revisa candidatos Git, contenido del índice y archivos de trabajo (incluidos archivos ya indexados aunque ahora estén ignorados), nombres de archivos privados, formatos conocidos de tokens, claves privadas, contraseñas literales/URLs y coincidencias con las credenciales locales generadas si existen. Informa archivo/tipo sin mostrar valores. Tiene limitaciones: no escanea historial remoto ni reconoce todo formato posible. Nunca fuerces un archivo privado con git add -f. Una credencial publicada debe revocarse; borrarla del último commit no elimina su exposición.

## Primera publicación o actualización

En cada copia, después de instalar y ejecutar sus comprobaciones:

```powershell
git status --short
npm run check:secrets
git add .
npm run check:secrets
git diff --cached --stat
git commit -m "Prepare TraceBoard source and quality checks"
git push -u origin main
```

La identidad de Git debe ser la del propietario; no pegar tokens ni contraseñas en URLs, comandos, README o código. Autenticarse mediante Git Credential Manager/GitHub Desktop o GitHub CLI. Las ramas remotas existentes se respetan: no usar force push para resolver una divergencia.

Fuente de los comandos de publicación: [documentación oficial de GitHub](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github).

Los workflows usan acciones oficiales fijadas a commits, token con permiso contents:read y sin credenciales de producción. Backend levanta PostgreSQL efímero con contraseña aleatoria exclusivamente en el runner para integración. Frontend ejecuta las regresiones locales de navegador; los recorridos remotos necesitan API/base de prueba y se verifican por separado. La ejecución de CI remoto se confirma después del push, no por la mera existencia del YAML.
