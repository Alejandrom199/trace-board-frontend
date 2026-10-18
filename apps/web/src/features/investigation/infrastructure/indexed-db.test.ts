import { describe, it, expect } from 'vitest';
import { demoWorkspace } from '../domain/demo';
import { MAX_FILE_BYTES } from '../domain/limits';
import { loadIndexedWorkspace, saveIndexedWorkspace, type AsyncStorageAccess } from './indexed-db';
import { STORAGE_KEY, type StorageAccess } from './local-storage';

function asyncStorage(initial: string | null = null): AsyncStorageAccess & { read(): string | null } {
  let value = initial;
  return { getItem: async () => value, setItem: async (key, item) => { expect(key).toBe(STORAGE_KEY); value = item; }, read: () => value };
}
const legacy = (raw: string | null): StorageAccess => ({ getItem: () => raw, setItem: () => { throw new Error('La copia anterior no debe modificarse'); } });

describe('Persistencia asíncrona y compatibilidad con tableros existentes', () => {
  it('recupera y migra la copia anterior sin modificarla', async () => {
    const workspace = demoWorkspace(); const raw = JSON.stringify(workspace); const storage = asyncStorage(); const previous = legacy(raw);
    const loaded = await loadIndexedWorkspace(storage, () => previous);
    expect(loaded).toEqual({ status: 'loaded', workspace });
    await saveIndexedWorkspace(storage, workspace);
    expect(previous.getItem(STORAGE_KEY)).toBe(raw);
    expect(JSON.parse(storage.read()!)).toEqual(workspace);
  });
  it('prioriza el tablero nuevo y no accede a una copia anterior obsoleta', async () => {
    const workspace = demoWorkspace();
    expect(await loadIndexedWorkspace(asyncStorage(JSON.stringify(workspace)), () => { throw new Error('No acceder al almacenamiento anterior'); })).toEqual({ status: 'loaded', workspace });
  });
  it('distingue un navegador vacío de datos nuevos corruptos', async () => {
    expect(await loadIndexedWorkspace(asyncStorage(), () => legacy(null))).toEqual({ status: 'empty' });
    const storage = asyncStorage('{corrupt');
    expect((await loadIndexedWorkspace(storage, () => legacy(JSON.stringify(demoWorkspace())))).status).toBe('error');
    expect(storage.read()).toBe('{corrupt');
  });
  it('espera a que termine la escritura antes de confirmar el guardado', async () => {
    const calls: string[] = []; let complete: (() => void) | undefined;
    const storage: AsyncStorageAccess = { getItem: async () => null, setItem: () => new Promise<void>(resolve => { complete = resolve; calls.push('started'); }) };
    const saving = saveIndexedWorkspace(storage, demoWorkspace()).then(() => calls.push('saved'));
    expect(calls).toEqual(['started']); complete!(); await saving; expect(calls).toEqual(['started', 'saved']);
  });
  it('expone fallos de cuota y de lectura sin simular éxito', async () => {
    const storage: AsyncStorageAccess = { getItem: async () => { throw new Error('Unavailable'); }, setItem: async () => { throw new Error('QuotaExceededError'); } };
    expect((await loadIndexedWorkspace(storage, () => legacy(null))).status).toBe('error');
    await expect(saveIndexedWorkspace(storage, demoWorkspace())).rejects.toThrow('No se pudo guardar');
  });
  it('guarda y recupera el base64 completo de un adjunto de 10 MB', async () => {
    const workspace = demoWorkspace();
    const asset = workspace.investigations[0]!.assets.find(asset => asset.id === 'screenshot-file')!;
    asset.size = MAX_FILE_BYTES; asset.mime = 'image/png';
    asset.url = 'data:image/png;base64,' + Buffer.alloc(MAX_FILE_BYTES).toString('base64');
    const storage = asyncStorage(); await saveIndexedWorkspace(storage, workspace);
    const loaded = await loadIndexedWorkspace(storage, () => legacy(null));
    expect(loaded.status).toBe('loaded');
    if (loaded.status === 'loaded') expect(loaded.workspace.investigations[0]!.assets.find(item => item.id === asset.id)).toEqual(asset);
  });
});
