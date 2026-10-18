# TraceBoard frontend

Next.js, React y React Flow. Canvas de investigaciones con persistencia local y comunicación HTTP con la API.

Aplicación separada del [backend](https://github.com/Alejandrom199/trace-board-backend). Requisitos: Node.js >=24.11.0 y npm 11.

## Iniciar

```powershell
npm ci
npm run dev
```

Abrir http://127.0.0.1:3000. Iniciar el backend por separado para guardado remoto; el modo local funciona sin API. TRACEBOARD_API_URL es una variable del servidor Next.js, por defecto http://127.0.0.1:4000. Se puede copiar apps/web/.env.example a apps/web/.env.local para cambiarla; rebuild si cambia el proxy.

Producción local: npm run build y npm start. Mantener el host/puerto del frontend conserva sus investigaciones locales.

## Calidad

```powershell
npm run check:secrets
npm run typecheck
npm run lint
npm test
npm run check:architecture
npm run build
```

E2E locales: instalar Chromium con npx playwright install chromium y ejecutar npm run test:e2e -- tests/e2e/board.spec.ts tests/e2e/history.spec.ts tests/e2e/vector-flow.spec.ts desde el workspace apps/web (o usar npm run test:e2e -w @traceboard/web -- ... desde raíz). Los E2E remotos requieren una API separada con base de pruebas, nunca datos de trabajo.

## Contratos y seguridad

packages/contracts contiene únicamente DTO/esquemas HTTP. contracts-manifest.json identifica el snapshot común con el otro repositorio; sincronizar ambos al cambiar contratos. No publicar credenciales, bases, documentos reales ni capturas. Solo ejemplos ficticios en código/pruebas. La API actual escucha en loopback y no tiene autenticación; subir código a GitHub no habilita un despliegue público seguro.

Ver [arquitectura](docs/ARCHITECTURE.md), [publicación](docs/GITHUB.md), [reglas](AGENTS.md) y [detalle de la aplicación](apps/web/README.md). El workspace de desarrollo conserva ambas apps; este repositorio contiene solo apps/web.
