import { test, expect } from '@playwright/test';
import { workspaceSchema } from '../../src/features/investigation/domain/model';

function demoFlow() {
  const now = '2026-01-01T00:00:00.000Z';
  const board = {
    id: 'demo-flow', name: 'Flujo de demostración', description: 'Datos ficticios de prueba, sin documentos de investigación.', createdAt: now, updatedAt: now,
    entities: [
      { id: 'p00', kind: 'process', title: '00 · Preparar revisión', description: 'Entrada: documento ficticio. Salida: contexto preparado.', createdAt: now, updatedAt: now },
      { id: 'p01', kind: 'process', title: '01 · Revisar documento', description: 'Revisión manual del ejemplo; no ejecuta el documento.', createdAt: now, updatedAt: now },
      { id: 'p02', kind: 'process', title: '02 · Registrar resultado', description: 'Resultado de demostración. No genera ni publica archivos.', createdAt: now, updatedAt: now },
      { id: 'note', kind: 'note', title: 'Fin de la revisión', description: 'Contexto ficticio.', createdAt: now, updatedAt: now },
      { id: 'doc', kind: 'document', title: 'Documento de ejemplo', description: 'Metadatos ficticios.', assetId: 'asset-demo', createdAt: now, updatedAt: now },
    ],
    edges: [
      { id: 'e1', sourceId: 'p00', targetId: 'p01', relation: 'related_to', description: 'Orden de lectura', metadata: { categoria: 'flujo' }, createdAt: now },
      { id: 'e2', sourceId: 'p01', targetId: 'p02', relation: 'related_to', description: 'Continuación en otra fila', metadata: { categoria: 'flujo' }, createdAt: now },
      { id: 'e3', sourceId: 'p02', targetId: 'note', relation: 'originates', description: 'Resultado', metadata: { categoria: 'flujo' }, createdAt: now },
    ],
    elements: [{ nodeId: 'p00', x: 0, y: 0 }, { nodeId: 'p01', x: 480, y: 0 }, { nodeId: 'p02', x: 0, y: 380 }, { nodeId: 'note', x: 480, y: 380 }, { nodeId: 'doc', x: 0, y: 760 }],
    assets: [{ id: 'asset-demo', name: 'documento-demo.pdf', mime: 'application/pdf', size: 100 }], viewport: { x: 25, y: 30, zoom: 0.7 },
  };
  return workspaceSchema.parse({ version: 1, activeId: board.id, investigations: [board] });
}

test('un flujo importado permite seguir la secuencia entre filas y se conserva al recargar', async ({ page }) => {
  const warnings: string[] = [];
  page.on('console', message => {
    if (message.type() === 'warning' && message.text().includes('[React Flow]')) warnings.push(message.text());
  });
  await page.goto('/');
  await expect(page.getByText('Guardado local', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir investigaciones', exact: true }).click();
  await page.getByRole('button', { name: 'Importar una copia JSON', exact: true }).click();
  await page.getByLabel('Seleccionar copia de investigación', { exact: true }).setInputFiles(
    { name: 'flujo-demo.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(demoFlow())) },
  );
  await expect(page.locator('.statusbar')).toContainText('5 tarjetas');
  await expect(page.locator('.statusbar')).toContainText('3 relaciones');
  await expect(page.locator('.edge-label').filter({ hasText: /^Continúa$/ })).toHaveCount(2);
  await expect(page.getByTestId('card-p00')).toContainText('Investigación');
  await expect(page.locator('.card-bottom').filter({ hasText: 'Inventario' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Buscar tarjetas', exact: true }).click();
  await page.getByRole('textbox', { name: 'Buscar tarjetas', exact: true }).fill('02 · Registrar');
  await page.getByRole('button', { name: /02 · Registrar resultado/ }).click();
  await expect(page.getByLabel('Descripción de tarjeta')).toHaveValue(/No genera ni publica archivos/);
  await page.getByRole('complementary', { name: 'Inspector de tarjeta' }).getByRole('button', { name: /^Relaciones/ }).click();
  await page.getByRole('button', { name: /01 · Revisar documento/ }).click();
  await expect(page.getByLabel('Descripción de tarjeta')).toHaveValue(/no ejecuta el documento/);
  await page.getByRole('button', { name: 'Cerrar inspector', exact: true }).click();
  await expect(page.getByText('Guardado local', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator('.statusbar')).toContainText('Flujo de demostración');
  await expect(page.locator('.statusbar')).toContainText('5 tarjetas');
  await expect(page.locator('.edge-label').filter({ hasText: /^Continúa$/ })).toHaveCount(2);
  await expect(page.getByRole('button', { name: /^documento-demo.pdf/ })).toBeVisible();
  expect(warnings).toEqual([]);
});
