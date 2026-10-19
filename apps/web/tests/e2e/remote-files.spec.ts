import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jO1sAAAAASUVORK5CYII=', 'base64');
function examplePdf(): Buffer {
  const content = 'BT /F1 12 Tf 72 720 Td (Evidencia de prueba) Tj ET';
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>', `<< /Length ${content.length} >>\nstream\n${content}\nendstream`, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  let text = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(text)); text += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(text);
  text += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(offset => String(offset).padStart(10, '0') + ' 00000 n ').join('\n')}\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(text);
}
async function create(page: Page, name: string) {
  await page.goto('/'); await expect(page.getByText('Guardado local', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir investigaciones', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Investigaciones en base de datos' }).getByRole('status')).toHaveCount(0);
  await page.getByLabel('Nombre en la base de datos').fill(name);
  await page.getByRole('button', { name: 'Crear en base de datos', exact: true }).click();
  await expect(page.locator('.project-title')).toHaveText(name);
}
async function open(page: Page, url: string, name: string) {
  await page.goto(url); await expect(page.getByText('Guardado local', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir investigaciones', exact: true }).click();
  await page.getByRole('region', { name: 'Investigaciones en base de datos' }).getByRole('button', { name: new RegExp('^' + name) }).click();
  await expect(page.locator('.project-title')).toHaveText(name);
}
async function preview(page: Page, name: string) {
  await page.getByRole('complementary', { name: 'Recursos y herramientas' }).getByRole('button', { name: new RegExp('^' + name) }).click();
  await page.getByRole('complementary', { name: 'Inspector de tarjeta' }).getByRole('button', { name: new RegExp('^' + name) }).click();
}
test('sube imagen y PDF, los reabre sin datos locales y descarga bytes exactos', async ({ page }) => {
  const name = 'Evidencias remotas ' + Date.now(); await create(page, name);
  const pdf = examplePdf();
  await page.getByLabel('Seleccionar archivos', { exact: true }).setInputFiles([
    { name: 'evidencia.png', mimeType: 'image/png', buffer: png }, { name: 'entrevista.pdf', mimeType: 'application/pdf', buffer: pdf },
  ]);
  await expect(page.locator('.knowledge-card')).toHaveCount(2);
  await page.getByRole('button', { name: 'Guardar en base de datos', exact: true }).click();
  await expect(page.locator('.remote-board-bar')).toContainText('Versión 1 en PostgreSQL');
  const context = await page.context().browser()!.newContext(); const fresh = await context.newPage();
  try {
    await open(fresh, new URL(page.url()).origin, name);
    await expect(fresh.locator('.knowledge-card')).toHaveCount(2);
    const image = fresh.locator('.knowledge-card.image img'); await expect(image).toHaveAttribute('src', /^\/api\/investigations\/.*\/files\//);
    await expect.poll(() => image.evaluate(element => element instanceof HTMLImageElement ? element.naturalWidth : 0)).toBeGreaterThan(0);
    await preview(fresh, 'evidencia.png');
    const dialog = fresh.getByRole('dialog'); await expect(dialog.locator('.image-preview img')).toHaveAttribute('src', /^blob:/);
    const imageDownload = fresh.waitForEvent('download'); await dialog.getByRole('link', { name: 'Descargar archivo', exact: true }).click();
    const downloadedImage = await imageDownload; expect((await readFile((await downloadedImage.path())!)).equals(png)).toBe(true);
    await dialog.getByRole('button', { name: 'Cerrar diálogo', exact: true }).click();
    await preview(fresh, 'entrevista.pdf'); await expect(fresh.getByRole('dialog').locator('iframe')).toHaveAttribute('src', /^blob:/);
    const pdfDownload = fresh.waitForEvent('download'); await fresh.getByRole('dialog').getByRole('link', { name: 'Descargar archivo', exact: true }).click();
    const downloadedPdf = await pdfDownload; expect((await readFile((await downloadedPdf.path())!)).equals(pdf)).toBe(true);
  } finally { await context.close(); }
});
test('si falla la subida no confirma el tablero y conserva el original local', async ({ page }) => {
  await create(page, 'Subida fallida ' + Date.now());
  await page.getByLabel('Seleccionar archivos', { exact: true }).setInputFiles({ name: 'evidencia.png', mimeType: 'image/png', buffer: png });
  await page.route('**/api/investigations/*/files', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
  await page.getByRole('button', { name: 'Guardar en base de datos', exact: true }).click();
  await expect(page.locator('.remote-board-bar').getByRole('alert')).toContainText('backend');
  await expect(page.locator('.remote-board-bar')).toContainText('Versión 0 en PostgreSQL');
  await expect(page.getByText('Guardado local', { exact: true })).toBeVisible(); await page.reload();
  await expect(page.locator('.knowledge-card.image img')).toHaveAttribute('src', /^data:image\/png;base64,/);
});
test('un original remoto no disponible muestra error sin borrar su tarjeta', async ({ page }) => {
  const name = 'Archivo no disponible ' + Date.now(); await create(page, name);
  await page.getByLabel('Seleccionar archivos', { exact: true }).setInputFiles({ name: 'evidencia.png', mimeType: 'image/png', buffer: png });
  await page.getByRole('button', { name: 'Guardar en base de datos', exact: true }).click(); await expect(page.locator('.remote-board-bar')).toContainText('Versión 1 en PostgreSQL');
  const context = await page.context().browser()!.newContext(); const fresh = await context.newPage();
  try {
    await fresh.route('**/api/investigations/*/files/*', route => route.fulfill({ status: 404, contentType: 'application/json', body: '{}' }));
    await open(fresh, new URL(page.url()).origin, name); await preview(fresh, 'evidencia.png');
    await expect(fresh.getByRole('dialog').getByRole('alert')).toContainText('no están disponibles');
    await fresh.getByRole('button', { name: 'Cerrar diálogo', exact: true }).click(); await expect(fresh.locator('.knowledge-card')).toHaveCount(1);
  } finally { await context.close(); }
});
test('editar durante una subida conserva los cambios pendientes y no vuelve a subir el archivo', async ({ page }) => {
  const name = 'Edición durante subida ' + Date.now(); await create(page, name);
  await page.getByLabel('Seleccionar archivos', { exact: true }).setInputFiles({ name: 'evidencia.png', mimeType: 'image/png', buffer: png });
  let release: (() => void) | undefined; const gate = new Promise<void>(resolve => { release = resolve; }); let uploads = 0;
  await page.route('**/api/investigations/*/files', async route => { uploads++; await gate; await route.continue(); });
  await page.getByRole('button', { name: 'Guardar en base de datos', exact: true }).click();
  await expect.poll(() => uploads).toBe(1);
  await page.getByRole('button', { name: 'Añadir nota', exact: true }).click();
  await page.getByLabel('Título de tarjeta').fill('Cambio mientras se subía');
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  release?.();
  await expect(page.locator('.remote-board-bar')).toContainText('Versión 1 en PostgreSQL');
  await expect(page.locator('.knowledge-card')).toHaveCount(2); await expect(page.locator('.remote-board-bar')).toContainText('cambios locales pendientes');
  await page.getByRole('button', { name: 'Guardar en base de datos', exact: true }).click();
  await expect(page.locator('.remote-board-bar')).toContainText('Versión 2 en PostgreSQL'); expect(uploads).toBe(1);
  const context = await page.context().browser()!.newContext(); const fresh = await context.newPage();
  try {
    await open(fresh, new URL(page.url()).origin, name); await expect(fresh.locator('.knowledge-card')).toHaveCount(2);
    await expect(fresh.getByRole('heading', { name: 'Cambio mientras se subía', exact: true })).toBeVisible();
  } finally { await context.close(); }
});
