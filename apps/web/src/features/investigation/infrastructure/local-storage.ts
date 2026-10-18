import { workspaceSchema, type Workspace } from '../domain/model';

export const STORAGE_KEY = 'traceboard.workspace.v1';
export const MAX_WORKSPACE_LENGTH = 128 * 1024 * 1024;
export interface StorageAccess { getItem(key: string): string | null; setItem(key: string, value: string): void }
export type LoadResult = { status: 'empty' } | { status: 'loaded'; workspace: Workspace } | { status: 'error'; message: string };
export function decodeWorkspace(raw: string): Workspace {
  if (raw.length > MAX_WORKSPACE_LENGTH) throw new Error('La copia del tablero supera el límite local de 128 MB');
  return workspaceSchema.parse(JSON.parse(raw));
}
export function loadWorkspace(storage: StorageAccess): LoadResult {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw === null ? { status: 'empty' } : { status: 'loaded', workspace: decodeWorkspace(raw) };
  } catch { return { status: 'error', message: 'No se pudo recuperar el tablero local. Tus datos guardados se conservaron. Exporta tu sesión o importa una copia válida antes de reactivar el guardado.' }; }
}
export function encodeWorkspace(workspace: Workspace): string {
  const raw = JSON.stringify(workspaceSchema.parse(workspace));
  if (raw.length > MAX_WORKSPACE_LENGTH) throw new Error('El tablero supera el límite local de 128 MB. Exporta una copia y reduce los adjuntos.');
  return raw;
}
export function saveWorkspace(storage: StorageAccess, workspace: Workspace): void {
  const raw = encodeWorkspace(workspace);
  try { storage.setItem(STORAGE_KEY, raw); }
  catch { throw new Error('No se pudo guardar en este navegador. Exporta una copia del tablero para conservar los cambios.'); }
}
