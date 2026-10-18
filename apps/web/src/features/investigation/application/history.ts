import type { Investigation } from '../domain/model';

export const HISTORY_LIMIT = 50;
interface HistoryEntry { before: Investigation; after: Investigation; label: string }
export interface BoardHistory { past: HistoryEntry[]; future: HistoryEntry[] }
export const emptyHistory = (): BoardHistory => ({ past: [], future: [] });

/** Snapshots share immutable payloads; never clone base64 attachments for history. */
export function recordHistory(history: BoardHistory, before: Investigation, after: Investigation, label: string): BoardHistory {
  if (before.id !== after.id) throw new Error('El historial pertenece a una sola investigación');
  if (before.entities === after.entities && before.edges === after.edges && before.elements === after.elements && before.assets === after.assets) return history;
  return { past: [...history.past, { before, after, label }].slice(-HISTORY_LIMIT), future: [] };
}

export function stepHistory(history: BoardHistory, current: Investigation, direction: 'undo' | 'redo', now: string): { history: BoardHistory; board: Investigation; label: string } | null {
  const entry = (direction === 'undo' ? history.past : history.future).at(-1);
  if (!entry) return null;
  if (entry.before.id !== current.id) throw new Error('No se puede aplicar el historial de otra investigación');
  const snapshot = direction === 'undo' ? entry.before : entry.after;
  return {
    board: { ...snapshot, remote: current.remote, viewport: current.viewport, updatedAt: now }, label: entry.label,
    history: direction === 'undo'
      ? { past: history.past.slice(0, -1), future: [...history.future, entry] }
      : { past: [...history.past, entry], future: history.future.slice(0, -1) },
  };
}
