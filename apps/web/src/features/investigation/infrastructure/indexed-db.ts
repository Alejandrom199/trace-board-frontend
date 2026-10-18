import type { Workspace } from '../domain/model';
import { decodeWorkspace, encodeWorkspace, loadWorkspace, STORAGE_KEY, type LoadResult, type StorageAccess } from './local-storage';

export const DATABASE_NAME = 'traceboard';
export const WORKSPACE_STORE = 'workspaces';
export interface AsyncStorageAccess {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new Error('El navegador no permite IndexedDB')); return; }
    const request = indexedDB.open(DATABASE_NAME, 1);
    let blocked = false;
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(WORKSPACE_STORE)) request.result.createObjectStore(WORKSPACE_STORE); };
    request.onerror = () => reject(new Error('No se pudo abrir el almacenamiento local'));
    request.onblocked = () => { blocked = true; reject(new Error('Cierra otras pestañas de TraceBoard y vuelve a intentarlo')); };
    request.onsuccess = () => { if (blocked) request.result.close(); else resolve(request.result); };
  });
}

export const indexedStorage: AsyncStorageAccess = {
  async getItem(key) {
    const database = await openDatabase();
    try {
      return await new Promise<string | null>((resolve, reject) => {
        const transaction = database.transaction(WORKSPACE_STORE, 'readonly');
        const request = transaction.objectStore(WORKSPACE_STORE).get(key);
        let value: string | null = null;
        request.onsuccess = () => {
          const stored: unknown = request.result;
          if (stored !== undefined && typeof stored !== 'string') { transaction.abort(); return; }
          value = stored ?? null;
        };
        transaction.oncomplete = () => resolve(value);
        transaction.onabort = () => reject(new Error('No se pudo leer el tablero guardado'));
        transaction.onerror = () => reject(new Error('No se pudo leer el tablero guardado'));
      });
    } finally { database.close(); }
  },
  async setItem(key, value) {
    const database = await openDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(WORKSPACE_STORE, 'readwrite');
        transaction.objectStore(WORKSPACE_STORE).put(value, key);
        // A request's success is not a committed transaction; only confirm after complete.
        transaction.oncomplete = () => resolve();
        transaction.onabort = () => reject(new Error('No se pudo guardar: comprueba el espacio disponible del navegador'));
        transaction.onerror = () => reject(new Error('No se pudo guardar: comprueba el espacio disponible del navegador'));
      });
    } finally { database.close(); }
  },
};

export async function loadIndexedWorkspace(storage: AsyncStorageAccess, legacyStorage: () => StorageAccess): Promise<LoadResult> {
  try {
    const raw = await storage.getItem(STORAGE_KEY);
    // The legacy copy remains untouched. The next autosave commits the migration to IndexedDB.
    if (raw === null) return loadWorkspace(legacyStorage());
    return { status: 'loaded', workspace: decodeWorkspace(raw) };
  } catch {
    return { status: 'error', message: 'No se pudo recuperar el tablero local. Tus datos guardados se conservaron. Exporta tu sesión o importa una copia válida antes de reactivar el guardado.' };
  }
}
export async function saveIndexedWorkspace(storage: AsyncStorageAccess, workspace: Workspace): Promise<void> {
  const raw = encodeWorkspace(workspace);
  try { await storage.setItem(STORAGE_KEY, raw); }
  catch { throw new Error('No se pudo guardar en este navegador. Comprueba el espacio disponible o exporta una copia para conservar los cambios.'); }
}

export const loadBrowserWorkspace = () => loadIndexedWorkspace(indexedStorage, () => window.localStorage);
// Serialize writes so an older save cannot overwrite a newer snapshot.
let pendingWrite: Promise<void> = Promise.resolve();
export function saveBrowserWorkspace(workspace: Workspace): Promise<void> {
  pendingWrite = pendingWrite.catch(() => undefined).then(() => saveIndexedWorkspace(indexedStorage, workspace));
  return pendingWrite;
}
