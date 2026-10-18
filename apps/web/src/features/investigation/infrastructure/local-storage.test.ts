import { describe, it, expect } from 'vitest';
import { demoWorkspace } from '../domain/demo';
import { STORAGE_KEY, MAX_WORKSPACE_LENGTH, loadWorkspace, saveWorkspace, decodeWorkspace, type StorageAccess } from './local-storage';
function memoryStorage(initial?: string): StorageAccess & { read(): string | null } {
  let value = initial ?? null;
  return { getItem: () => value, setItem: (key, item) => { expect(key).toBe(STORAGE_KEY); value = item; }, read: () => value };
}
describe('Persistencia local versionada', () => {
  it('distingue almacenamiento vacío de datos corruptos', () => {
    expect(loadWorkspace(memoryStorage())).toEqual({ status: 'empty' });
    const storage = memoryStorage('{broken'); expect(loadWorkspace(storage).status).toBe('error'); expect(storage.read()).toBe('{broken');
  });
  it('recupera contenido, conexiones, posiciones y viewport', () => {
    const storage = memoryStorage(); const workspace = demoWorkspace(); workspace.investigations[0]!.viewport = { x: -100, y: 50, zoom: .7 };
    saveWorkspace(storage, workspace); expect(loadWorkspace(storage)).toEqual({ status: 'loaded', workspace });
  });
  it('rechaza versiones desconocidas y referencias huérfanas sin sobrescribir', () => {
    const workspace = demoWorkspace(); workspace.investigations[0]!.edges[0]!.sourceId = 'missing';
    const storage = memoryStorage(JSON.stringify(workspace)); const original = storage.read();
    expect(loadWorkspace(storage).status).toBe('error'); expect(storage.read()).toBe(original);
    expect(() => decodeWorkspace(JSON.stringify({ ...demoWorkspace(), version: 99 }))).toThrow();
  });
  it('expone errores de cuota sin afirmar guardado correcto', () => {
    const storage: StorageAccess = { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError'); } };
    expect(() => saveWorkspace(storage, demoWorkspace())).toThrow('No se pudo guardar');
  });
  it('rechaza entradas sobredimensionadas y selección activa inexistente', () => {
    expect(() => decodeWorkspace(' '.repeat(MAX_WORKSPACE_LENGTH + 1))).toThrow('límite');
    expect(() => decodeWorkspace(JSON.stringify({ ...demoWorkspace(), activeId: 'missing' }))).toThrow();
  });
});
