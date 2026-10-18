import { test, expect, type Page } from '@playwright/test';

async function createRemote(page: Page, name: string) {
  await page.goto('/'); await expect(page.getByText('Guardado local', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir investigaciones', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Investigaciones en base de datos' }).getByRole('status')).toHaveCount(0);
  await page.getByLabel('Nombre en la base de datos').fill(name);
  await page.getByRole('button', { name: 'Crear en base de datos', exact: true }).click();
  await expect(page.locator('.project-title')).toHaveText(name);
  await expect(page.getByRole('button', { name: 'Guardar en base de datos', exact: true })).toBeVisible();
}
async function openRemote(page: Page, url: string, name: string) {
  await page.goto(url); await expect(page.getByText('Guardado local', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir investigaciones', exact: true }).click();
  await page.getByRole('region', { name: 'Investigaciones en base de datos' }).getByRole('button', { name: new RegExp(name) }).click();
  await expect(page.locator('.project-title')).toHaveText(name);
}
async function addCard(page: Page, kind: string, title: string) {
  await page.getByRole('button', { name: 'Añadir ' + kind, exact: true }).click();
  await page.getByLabel('Título de tarjeta').fill(title);
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
}
async function relate(page: Page, source: string, target: string, relation: string) {
  await page.getByRole('button', { name: 'Crear relación semántica', exact: true }).click();
  await page.getByLabel('Tarjeta de origen').selectOption({ label: source });
  await page.getByLabel('Tarjeta de destino').selectOption({ label: target });
  await page.getByLabel('Tipo de relación').selectOption(relation);
  await page.getByRole('button', { name: 'Crear relación', exact: true }).click();
}
test('documento → hallazgo → requisito conserva evidencias desde otra sesión', async ({ page }) => {
  const name = 'Trazabilidad ' + Date.now(); await createRemote(page, name);
  await addCard(page, 'documento', 'Entrevista de inventario');
  await addCard(page, 'hallazgo', 'Stock desactualizado');
  await addCard(page, 'requisito', 'Actualizar stock en cada venta');
  await relate(page, 'Entrevista de inventario', 'Stock desactualizado', 'evidences');
  await relate(page, 'Stock desactualizado', 'Actualizar stock en cada venta', 'originates');
  await page.getByRole('button', { name: 'Guardar en base de datos', exact: true }).click();
  await expect(page.locator('.remote-board-bar')).toContainText('Versión 1 en PostgreSQL');
  const context = await page.context().browser()!.newContext(); const fresh = await context.newPage();
  try {
    await openRemote(fresh, new URL(page.url()).origin, name);
    await expect(fresh.locator('.knowledge-card')).toHaveCount(3); await expect(fresh.locator('.statusbar')).toContainText('2 relaciones');
    await fresh.getByRole('button', { name: 'Buscar tarjetas', exact: true }).click();
    await fresh.getByRole('textbox', { name: 'Buscar tarjetas', exact: true }).fill('Actualizar stock en cada venta');
    await fresh.getByRole('button', { name: /Actualizar stock en cada venta/ }).click();
    await expect(fresh.getByRole('heading', { name: /Evidencias de origen/ })).toContainText('1');
    await fresh.getByRole('button', { name: 'Entrevista de inventario', exact: true }).click();
    await expect(fresh.getByLabel('Título de tarjeta')).toHaveValue('Entrevista de inventario');
  } finally { await context.close(); }
});
test('conflicto remoto conserva el borrador local y permite reabrir sin perderlo', async ({ page }) => {
  const name = 'Conflicto ' + Date.now(); await createRemote(page, name);
  await addCard(page, 'nota', 'Versión inicial'); await page.getByRole('button', { name: 'Guardar en base de datos', exact: true }).click();
  await expect(page.locator('.remote-board-bar')).toContainText('Versión 1 en PostgreSQL');
  const context = await page.context().browser()!.newContext(); const other = await context.newPage();
  try {
    await openRemote(other, new URL(page.url()).origin, name);
    await addCard(other, 'nota', 'Cambio de otra sesión'); await other.getByRole('button', { name: 'Guardar en base de datos', exact: true }).click();
    await expect(other.locator('.remote-board-bar')).toContainText('Versión 2 en PostgreSQL');
    await addCard(page, 'nota', 'Borrador que conservar'); await page.getByRole('button', { name: 'Guardar en base de datos', exact: true }).click();
    await expect(page.locator('.remote-board-bar').getByRole('alert')).toContainText('Otra sesión guardó');
    await expect(page.locator('.knowledge-card')).toHaveCount(2);
    await page.getByRole('button', { name: 'Abrir investigaciones', exact: true }).click();
    await page.getByRole('region', { name: 'Investigaciones en base de datos' }).getByRole('button', { name: new RegExp(name) }).click();
    await expect(page.locator('.remote-board-bar')).toContainText('Versión 2 en PostgreSQL');
    await page.getByRole('button', { name: 'Abrir investigaciones', exact: true }).click();
    await page.getByRole('button', { name: new RegExp(name + ' \\(copia local\\)') }).click();
    await page.getByRole('button', { name: 'Buscar tarjetas', exact: true }).click();
    await page.getByRole('textbox', { name: 'Buscar tarjetas', exact: true }).fill('Borrador que conservar');
    await expect(page.getByRole('button', { name: /Borrador que conservar/ })).toBeVisible();
  } finally { await context.close(); }
});
test('un fallo de guardado remoto mantiene el autoguardado local', async ({ page }) => {
  await createRemote(page, 'Fallo remoto ' + Date.now()); await addCard(page, 'nota', 'Trabajo protegido');
  await page.route('**/api/investigations/*/board', route => route.request().method() === 'PUT' ? route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }) : route.continue());
  await page.getByRole('button', { name: 'Guardar en base de datos', exact: true }).click();
  await expect(page.locator('.remote-board-bar').getByRole('alert')).toContainText('base de datos no está disponible');
  await expect(page.getByText('Guardado local', { exact: true })).toBeVisible(); await page.reload();
  await expect(page.locator('.knowledge-card')).toHaveCount(1); await expect(page.locator('.remote-board-bar')).toContainText('Versión 0 en PostgreSQL');
});
