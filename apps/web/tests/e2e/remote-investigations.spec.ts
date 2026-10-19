import { test, expect } from '@playwright/test';

test('crea en PostgreSQL y reabre desde otra sesión sin datos locales', async ({ page }) => {
  await page.goto('/'); await expect(page.getByText('Guardado local', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir investigaciones', exact: true }).click();
  const section = page.getByRole('region', { name: 'Investigaciones en base de datos' });
  await expect(section.getByRole('status')).toHaveCount(0);
  const name = 'Inventario remoto ' + Date.now();
  await page.getByLabel('Nombre en la base de datos').fill(name);
  await page.getByLabel('Descripción en la base de datos').fill('Investigación recuperable desde una sesión nueva');
  await page.getByRole('button', { name: 'Crear en base de datos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Toda investigación empieza con una pista.' })).toBeVisible();
  const origin = new URL(page.url()).origin;
  const context = await page.context().browser()!.newContext();
  const fresh = await context.newPage();
  try {
    await fresh.goto(origin); await expect(fresh.getByText('Guardado local', { exact: true })).toBeVisible();
    await fresh.getByRole('button', { name: 'Abrir investigaciones', exact: true }).click();
    const remote = fresh.getByRole('region', { name: 'Investigaciones en base de datos' });
    await remote.getByRole('button', { name: new RegExp('^' + name) }).click();
    await expect(fresh.locator('.project-title')).toHaveText(name);
    await expect(fresh.getByRole('heading', { name: 'Toda investigación empieza con una pista.' })).toBeVisible();
  } finally { await context.close(); }
});

test('una API caída informa el error y permite trabajar localmente', async ({ page }) => {
  await page.route('**/api/investigations', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"Unavailable"}' }));
  await page.goto('/'); await expect(page.getByText('Guardado local', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir investigaciones', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Investigaciones en base de datos' }).getByRole('alert')).toContainText('base de datos no está disponible');
  await page.getByRole('button', { name: 'Cerrar diálogo', exact: true }).click();
  await page.getByRole('button', { name: 'Añadir nota', exact: true }).click();
  await expect(page.locator('.knowledge-card')).toHaveCount(13);
});

test('elimina una investigación de la base de datos tras confirmar', async ({ page }) => {
  const name = 'Eliminar remota ' + Date.now();
  await page.goto('/'); await expect(page.getByText('Guardado local', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir investigaciones', exact: true }).click();
  const section = page.getByRole('region', { name: 'Investigaciones en base de datos' });
  await expect(section.getByRole('status')).toHaveCount(0);
  await page.getByLabel('Nombre en la base de datos').fill(name);
  await page.getByRole('button', { name: 'Crear en base de datos', exact: true }).click();
  await expect(page.locator('.project-title')).toHaveText(name);
  await page.getByRole('button', { name: 'Abrir investigaciones', exact: true }).click();
  await section.getByRole('button', { name: 'Eliminar de la base de datos ' + name, exact: true }).click();
  await section.getByRole('group', { name: 'Confirmar eliminación de ' + name }).getByRole('button', { name: 'Eliminar', exact: true }).click();
  await expect(section.getByRole('status')).toContainText('se eliminó de la base de datos');
  await section.getByRole('button', { name: 'Actualizar investigaciones remotas', exact: true }).click();
  await expect(section.getByRole('button', { name: new RegExp('^' + name) })).toHaveCount(0);
});
