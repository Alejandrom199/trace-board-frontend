import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.goto('/'); await expect(page.getByText('Guardado local', { exact: true })).toBeVisible(); });

test('deshacer y rehacer una edición refresca el inspector', async ({ page }) => {
  await page.getByRole('button', { name: 'Añadir nota', exact: true }).click();
  await page.getByLabel('Título de tarjeta').fill('Auditar devoluciones');
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  await page.keyboard.press('Control+z');
  await expect(page.getByLabel('Título de tarjeta')).toHaveValue('Nueva nota');
  await expect(page.locator('.knowledge-card')).toHaveCount(9);
  await page.keyboard.press('Control+Shift+z');
  await expect(page.getByLabel('Título de tarjeta')).toHaveValue('Auditar devoluciones');
});

test('restaura una eliminación múltiple con relaciones y guarda el resultado', async ({ page }) => {
  await page.getByTestId('card-interview').locator('h3').click();
  await page.getByTestId('card-spreadsheet').locator('h3').click({ modifiers: ['Shift'] });
  await page.keyboard.press('Delete');
  await expect(page.locator('.knowledge-card')).toHaveCount(6); await expect(page.locator('.statusbar')).toContainText('4 relaciones');
  await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
  await expect(page.locator('.knowledge-card')).toHaveCount(8); await expect(page.locator('.statusbar')).toContainText('7 relaciones');
  await page.getByRole('button', { name: 'Rehacer', exact: true }).click();
  await expect(page.locator('.knowledge-card')).toHaveCount(6);
  await page.keyboard.press('Control+z');
  await expect(page.locator('.knowledge-card')).toHaveCount(8);
  await expect(page.getByText('Guardado local', { exact: true })).toBeVisible(); await page.reload();
  await expect(page.locator('.knowledge-card')).toHaveCount(8); await expect(page.locator('.statusbar')).toContainText('7 relaciones');
  await expect(page.getByRole('button', { name: 'Deshacer', exact: true })).toBeDisabled();
});

test('un arrastre de muchos pasos se deshace en una sola acción', async ({ page }) => {
  const card = page.getByTestId('card-interview'); const initial = await card.boundingBox();
  await page.mouse.move(initial!.x + 40, initial!.y + 40); await page.mouse.down();
  await page.mouse.move(initial!.x + 170, initial!.y + 130, { steps: 24 }); await page.mouse.up();
  const moved = await card.boundingBox(); expect(moved!.x).toBeGreaterThan(initial!.x + 70);
  await page.keyboard.press('Control+z'); const restored = await card.boundingBox();
  expect(Math.abs(restored!.x - initial!.x)).toBeLessThan(2); expect(Math.abs(restored!.y - initial!.y)).toBeLessThan(2);
  await expect(page.getByRole('button', { name: 'Deshacer', exact: true })).toBeDisabled();
  await page.keyboard.press('Control+y'); const redone = await card.boundingBox();
  expect(Math.abs(redone!.x - moved!.x)).toBeLessThan(2); expect(Math.abs(redone!.y - moved!.y)).toBeLessThan(2);
});

test('la creación de relaciones se puede deshacer y rehacer', async ({ page }) => {
  await page.getByRole('button', { name: 'Crear relación semántica' }).click();
  await page.getByLabel('Tarjeta de origen').selectOption('interview'); await page.getByLabel('Tarjeta de destino').selectOption('req-stock');
  await page.getByLabel('Tipo de relación').selectOption('references');
  await page.getByRole('button', { name: 'Crear relación', exact: true }).click();
  await expect(page.locator('.statusbar')).toContainText('8 relaciones');
  await page.keyboard.press('Control+z'); await expect(page.locator('.statusbar')).toContainText('7 relaciones');
  await page.keyboard.press('Control+Shift+z'); await expect(page.locator('.statusbar')).toContainText('8 relaciones');
});

test('cada investigación conserva un historial independiente', async ({ page }) => {
  await page.getByRole('button', { name: 'Añadir nota', exact: true }).click();
  await page.getByRole('button', { name: 'Abrir investigaciones', exact: true }).click();
  await page.getByLabel('Nombre de investigación').fill('Compras'); await page.getByRole('button', { name: 'Crear investigación', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Deshacer', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Añadir hallazgo', exact: true }).click();
  await page.getByRole('button', { name: 'Abrir investigaciones', exact: true }).click();
  await page.getByRole('button', { name: /Sistema de Inventario.*9 tarjetas/ }).click();
  await page.keyboard.press('Control+z'); await expect(page.locator('.knowledge-card')).toHaveCount(8);
  await page.getByRole('button', { name: 'Abrir investigaciones', exact: true }).click();
  await page.getByRole('button', { name: /Compras.*1 tarjetas/ }).click();
  await expect(page.locator('.knowledge-card')).toHaveCount(1);
  await page.keyboard.press('Control+z'); await expect(page.locator('.knowledge-card')).toHaveCount(0);
});

test('los atajos de texto no revierten acciones del tablero', async ({ page }) => {
  await page.getByRole('button', { name: 'Añadir nota', exact: true }).click();
  await page.getByLabel('Título de tarjeta').click(); await page.getByLabel('Título de tarjeta').press('End');
  await page.getByLabel('Título de tarjeta').pressSequentially(' sin aplicar'); await page.keyboard.press('Control+z');
  await expect(page.locator('.knowledge-card')).toHaveCount(9);
  await expect(page.getByRole('button', { name: 'Rehacer', exact: true })).toBeDisabled();
});
