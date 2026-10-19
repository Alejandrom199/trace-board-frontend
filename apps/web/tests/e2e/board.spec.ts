import { test, expect } from '@playwright/test';
const MAX_FILE_BYTES = 10 * 1024 * 1024;
test('crear y editar una nota conserva los cambios al recargar', async ({ page }) => {
  await page.goto('/'); await expect(page.getByText('Guardado local', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Añadir nota', exact: true }).click();
  await page.getByLabel('Título de tarjeta').fill('Validar devoluciones');
  await page.getByLabel('Descripción de tarjeta').fill('Confirmar el proceso con el responsable de bodega.');
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  await expect(page.getByText('Guardado local', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Buscar tarjetas', exact: true }).click();
  await page.getByRole('textbox', { name: 'Buscar tarjetas', exact: true }).fill('Validar devoluciones');
  await expect(page.getByRole('button', { name: /Validar devoluciones/ })).toBeVisible();
});
test('crea una relación y presenta evidencias transitivas de un requisito', async ({ page }) => {
  await page.goto('/'); await expect(page.getByText('Guardado local', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Crear relación semántica' }).click();
  await page.getByLabel('Tarjeta de origen').selectOption('interview');
  await page.getByLabel('Tarjeta de destino').selectOption('req-stock');
  await page.getByLabel('Tipo de relación').selectOption('references');
  await page.getByRole('button', { name: 'Crear relación', exact: true }).click();
  await expect(page.locator('.statusbar')).toContainText('13 relaciones');
  // El ejemplo ya incluye una referencia de la pregunta al actor.
  await expect(page.locator('.edge-label').filter({ hasText: 'Referencia' })).toHaveCount(2);
  await page.getByRole('button', { name: 'Buscar tarjetas', exact: true }).click();
  await page.getByRole('textbox', { name: 'Buscar tarjetas', exact: true }).fill('RF-001');
  await page.getByRole('button', { name: /Registrar cada movimiento de inventario/ }).click();
  await expect(page.getByRole('heading', { name: /Evidencias de origen/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Entrevista con el encargado de bodega', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Movimientos de inventario', exact: true })).toBeVisible();
});

test('mover una tarjeta conserva su posición al recargar', async ({ page }) => {
  const warnings: string[] = [];
  page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[React Flow]')) warnings.push(message.text()); });
  await page.goto('/'); await expect(page.getByText('Guardado local', { exact: true })).toBeVisible();
  const card = page.getByTestId('card-interview'); const initial = await card.boundingBox(); expect(initial).not.toBeNull();
  await page.mouse.move(initial!.x + 40, initial!.y + 40); await page.mouse.down();
  await page.mouse.move(initial!.x + 140, initial!.y + 110, { steps: 12 }); await page.mouse.up();
  await expect(page.getByText('Guardado local', { exact: true })).toBeVisible();
  const moved = await card.boundingBox(); expect(moved!.x).toBeGreaterThan(initial!.x + 50);
  await page.reload(); await expect(page.getByText('Guardado local', { exact: true })).toBeVisible();
  const restored = await card.boundingBox(); expect(Math.abs(restored!.x - moved!.x)).toBeLessThan(2); expect(Math.abs(restored!.y - moved!.y)).toBeLessThan(2);
  expect(warnings).toEqual([]);
});

test('selección múltiple elimina tarjetas sin dejar relaciones huérfanas', async ({ page }) => {
  await page.goto('/'); await expect(page.getByText('Guardado local', { exact: true })).toBeVisible();
  await page.getByTestId('card-interview').locator('h3').click();
  await page.getByTestId('card-spreadsheet').locator('h3').click({ modifiers: ['Shift'] });
  await expect(page.locator('.knowledge-card.is-selected')).toHaveCount(2);
  await page.keyboard.press('Delete');
  await expect(page.getByTestId('card-interview')).toHaveCount(0); await expect(page.getByTestId('card-spreadsheet')).toHaveCount(0);
  await expect(page.getByText('Guardado local', { exact: true })).toBeVisible(); await page.reload();
  await expect(page.locator('.knowledge-card')).toHaveCount(10);
  await expect(page.locator('.statusbar')).toContainText('9 relaciones');
});

test('crear una investigación mantiene disponible la original', async ({ page }) => {
  await page.goto('/'); await expect(page.getByText('Guardado local', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir investigaciones', exact: true }).click();
  await page.getByLabel('Nombre de investigación').fill('Sistema de compras');
  await page.getByRole('button', { name: 'Crear investigación', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Toda investigación empieza con una pista.' })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir investigaciones', exact: true }).click();
  await page.getByRole('button', { name: /Sistema de Inventario.*12 tarjetas/ }).click();
  await expect(page.locator('.knowledge-card')).toHaveCount(12);
});

test('datos locales corruptos se conservan y el guardado queda bloqueado', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('traceboard.workspace.v1', '{corrupt'); });
  await page.goto('/'); await expect(page.getByRole('alert').filter({ hasText: 'No se pudo recuperar' })).toContainText('Tus datos guardados se conservaron');
  await expect(page.getByText('Sin guardar', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Añadir nota', exact: true }).click();
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => localStorage.getItem('traceboard.workspace.v1'))).toBe('{corrupt');
});

test('conectar puntos de tarjetas crea una relación semántica persistente', async ({ page }) => {
  await page.goto('/'); await expect(page.getByText('Guardado local', { exact: true })).toBeVisible();
  const source = await page.getByTestId('card-note').locator('.react-flow__handle-right').boundingBox();
  const target = await page.getByTestId('card-req-trace').locator('.react-flow__handle-left').boundingBox();
  expect(source).not.toBeNull(); expect(target).not.toBeNull();
  await page.mouse.move(source!.x + source!.width / 2, source!.y + source!.height / 2); await page.mouse.down();
  await page.mouse.move(target!.x + target!.width / 2, target!.y + target!.height / 2, { steps: 20 }); await page.mouse.up();
  await expect(page.locator('.statusbar')).toContainText('13 relaciones');
  await expect(page.getByText('Guardado local', { exact: true })).toBeVisible(); await page.reload();
  await expect(page.locator('.statusbar')).toContainText('13 relaciones');
});

test('adjuntar una imagen pequeña conserva su vista previa al recargar', async ({ page }) => {
  await page.goto('/'); await expect(page.getByText('Guardado local', { exact: true })).toBeVisible();
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jO1sAAAAASUVORK5CYII=', 'base64');
  await page.getByLabel('Seleccionar archivos', { exact: true }).setInputFiles({ name: 'evidencia.png', mimeType: 'image/png', buffer: png });
  await expect(page.getByText('Guardado local', { exact: true })).toBeVisible(); await page.reload();
  const image = page.locator('.knowledge-card.image img').filter({ visible: true }).last();
  await expect(page.locator('.knowledge-card')).toHaveCount(13);
  await expect(image).toHaveAttribute('src', /^data:image\/png;base64,/);
});

test('un archivo de 10 MB se guarda íntegro y se recupera tras recargar', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/'); await expect(page.getByText('Guardado local', { exact: true })).toBeVisible();
  const png = Buffer.alloc(MAX_FILE_BYTES);
  Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jO1sAAAAASUVORK5CYII=', 'base64').copy(png);
  await page.getByLabel('Seleccionar archivos', { exact: true }).setInputFiles({ name: 'evidencia-10mb.png', mimeType: 'image/png', buffer: png });
  await expect(page.locator('.knowledge-card')).toHaveCount(13);
  await expect(page.getByText('Guardado local', { exact: true })).toBeVisible({ timeout: 20000 });
  await page.reload(); await expect(page.locator('.knowledge-card')).toHaveCount(13);
  const source = await page.locator('.knowledge-card.image img').last().getAttribute('src');
  expect(source?.startsWith('data:image/png;base64,')).toBe(true);
  expect(Buffer.from(source!.split(',')[1]!, 'base64').equals(png)).toBe(true);
});

test('un archivo mayor a 10 MB se rechaza sin cambiar el tablero', async ({ page }) => {
  await page.goto('/'); await expect(page.getByText('Guardado local', { exact: true })).toBeVisible();
  await page.getByLabel('Seleccionar archivos', { exact: true }).setInputFiles({ name: 'demasiado-grande.png', mimeType: 'image/png', buffer: Buffer.alloc(MAX_FILE_BYTES + 1) });
  await expect(page.locator('.error-banner')).toContainText('hasta 10 MB');
  await expect(page.locator('.knowledge-card')).toHaveCount(12);
});

test('migra una investigación anterior sin eliminar su copia local', async ({ page }) => {
  // Obtain an example snapshot from this test's isolated browser, never from user data.
  await page.goto('/'); await expect(page.getByText('Guardado local', { exact: true })).toBeVisible();
  const copy = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('traceboard', 1); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    try { return await new Promise<string>((resolve, reject) => { const request = database.transaction('workspaces', 'readonly').objectStore('workspaces').get('traceboard.workspace.v1'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
    finally { database.close(); }
  });
  const context = await page.context().browser()!.newContext();
  await context.addInitScript(raw => { localStorage.setItem('traceboard.workspace.v1', raw); }, copy);
  const legacyPage = await context.newPage();
  try {
    await legacyPage.goto(page.url()); await expect(legacyPage.getByText('Guardado local', { exact: true })).toBeVisible();
    await expect(legacyPage.locator('.knowledge-card')).toHaveCount(12);
    expect(await legacyPage.evaluate(() => localStorage.getItem('traceboard.workspace.v1'))).toBe(copy);
    await legacyPage.reload(); await expect(legacyPage.locator('.knowledge-card')).toHaveCount(12);
  } finally { await context.close(); }
});

test('crea una regla de negocio y un requisito no funcional visibles en la vista de requisitos', async ({ page }) => {
  await page.goto('/'); await expect(page.getByText('Guardado local', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Añadir regla de negocio', exact: true }).click();
  await expect(page.getByRole('complementary', { name: 'Inspector de tarjeta' })).toContainText('RN-002');
  await page.getByRole('button', { name: 'Añadir requisito', exact: true }).click();
  await page.getByLabel('Título de tarjeta').fill('Responder en menos de 2 segundos');
  await page.getByLabel('Tipo de requisito', { exact: true }).selectOption('non_functional');
  await page.getByLabel('Característica de calidad').selectOption('performance');
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  await expect(page.getByText('Guardado local', { exact: true })).toBeVisible(); await page.reload();
  await page.getByRole('button', { name: 'Ver requisitos', exact: true }).click();
  const nonFunctional = page.getByRole('region', { name: 'Requisitos no funcionales' });
  await expect(nonFunctional).toContainText('RNF-001 · Rendimiento');
  await expect(nonFunctional).toContainText('Responder en menos de 2 segundos');
  await expect(page.getByRole('region', { name: 'Requisitos funcionales' })).toContainText('RF-001');
});

test('elimina una investigación local tras confirmar y conserva el resto al recargar', async ({ page }) => {
  await page.goto('/'); await expect(page.getByText('Guardado local', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir investigaciones', exact: true }).click();
  await page.getByLabel('Nombre de investigación').fill('Borrar después');
  await page.getByRole('button', { name: 'Crear investigación', exact: true }).click();
  await page.getByRole('button', { name: 'Abrir investigaciones', exact: true }).click();
  await page.getByRole('button', { name: 'Eliminar investigación Borrar después', exact: true }).click();
  const confirm = page.getByRole('group', { name: 'Confirmar eliminación de Borrar después' });
  await confirm.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByRole('button', { name: /Borrar después/ }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Eliminar investigación Borrar después', exact: true }).click();
  await confirm.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await expect(page.locator('.project-title')).toHaveText('Sistema de Inventario');
  await expect(page.getByText('Guardado local', { exact: true })).toBeVisible(); await page.reload();
  await page.getByRole('button', { name: 'Abrir investigaciones', exact: true }).click();
  await expect(page.getByRole('button', { name: /Borrar después/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Eliminar investigación Sistema de Inventario', exact: true })).toBeDisabled();
});
