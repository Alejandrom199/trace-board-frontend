import { describe, expect, it } from 'vitest';
import { demoInvestigation } from '../domain/demo';
import { investigationSchema } from '../domain/model';
import { addCard, createInvestigation, removeCards, updateCard } from './actions';
import { emptyHistory, recordHistory, stepHistory, HISTORY_LIMIT } from './history';
const now = '2026-10-13T18:00:00.000Z';

describe('Historial del tablero independiente del editor', () => {
  it('deshacer conserva la revisión remota confirmada después de editar', () => {
    const before = demoInvestigation(); const after = addCard(before, 'note', 'new', now, { x: 1, y: 2 });
    const current = { ...after, remote: { revision: 3, fingerprint: 'a'.repeat(64) } };
    const result = stepHistory(recordHistory(emptyHistory(), before, after, 'Crear nota'), current, 'undo', now)!;
    expect(result.board.remote).toEqual(current.remote); expect(result.board.entities).toEqual(before.entities);
  });
  it('restaura tarjetas eliminadas junto con posición, relaciones y adjuntos', () => {
    const original = demoInvestigation(); const removed = removeCards(original, ['screenshot', 'interview'], now);
    const history = recordHistory(emptyHistory(), original, removed, 'Eliminar tarjetas');
    const undone = stepHistory(history, removed, 'undo', now)!;
    expect(undone.board.entities).toEqual(original.entities); expect(undone.board.edges).toEqual(original.edges);
    expect(undone.board.assets).toEqual(original.assets); expect(undone.board.elements).toEqual(original.elements);
    expect(investigationSchema.safeParse(undone.board).success).toBe(true);
    const redone = stepHistory(undone.history, undone.board, 'redo', now)!;
    expect(redone.board.entities).toEqual(removed.entities); expect(redone.board.edges).toEqual(removed.edges);
    expect(investigationSchema.safeParse(redone.board).success).toBe(true);
  });
  it('restaura una edición conservando el viewport de navegación actual', () => {
    const before = demoInvestigation(); const note = before.entities.find(entity => entity.id === 'note')!;
    const after = updateCard(before, { ...note, title: 'Preguntas resueltas', updatedAt: now });
    const current = { ...after, viewport: { x: 270, y: -50, zoom: 1.1 } };
    const result = stepHistory(recordHistory(emptyHistory(), before, after, 'Editar nota'), current, 'undo', now)!;
    expect(result.board.entities.find(entity => entity.id === note.id)?.title).toBe(note.title);
    expect(result.board.viewport).toEqual(current.viewport);
    expect(stepHistory(result.history, result.board, 'redo', now)?.board.entities.find(entity => entity.id === note.id)?.title).toBe('Preguntas resueltas');
  });
  it('no consume historial para cambios exclusivos de navegación', () => {
    const before = demoInvestigation(); const history = emptyHistory();
    expect(recordHistory(history, before, { ...before, viewport: { x: 10, y: 15, zoom: 1 } }, 'Navegar')).toBe(history);
    expect(stepHistory(history, before, 'undo', now)).toBeNull(); expect(stepHistory(history, before, 'redo', now)).toBeNull();
  });
  it('descarta rehacer al empezar una nueva rama de cambios', () => {
    const before = demoInvestigation(); const after = addCard(before, 'note', 'new', now, { x: 1, y: 2 });
    const undone = stepHistory(recordHistory(emptyHistory(), before, after, 'Crear nota'), after, 'undo', now)!;
    const different = addCard(undone.board, 'finding', 'finding-new', now, { x: 3, y: 4 });
    const history = recordHistory(undone.history, undone.board, different, 'Crear hallazgo');
    expect(stepHistory(history, different, 'redo', now)).toBeNull();
    expect(stepHistory(history, different, 'undo', now)?.board.entities).toEqual(before.entities);
  });
  it('limita la retención a las últimas 50 acciones completas', () => {
    let board = createInvestigation('board', 'Prueba', now); let history = emptyHistory();
    for (let index = 0; index <= HISTORY_LIMIT; index++) {
      const next = addCard(board, 'note', `note-${index}`, now, { x: index, y: 0 });
      history = recordHistory(history, board, next, 'Crear nota'); board = next;
    }
    for (let index = 0; index < HISTORY_LIMIT; index++) { const result = stepHistory(history, board, 'undo', now)!; history = result.history; board = result.board; }
    expect(board.entities).toHaveLength(1); expect(stepHistory(history, board, 'undo', now)).toBeNull();
  });
  it('rechaza mezclar investigaciones y mantiene intactos los snapshots originales', () => {
    const before = demoInvestigation(); const after = removeCards(before, ['note'], now);
    const other = createInvestigation('other', 'Otra', now);
    expect(() => recordHistory(emptyHistory(), before, other, 'Mezclar')).toThrow('una sola investigación');
    const history = recordHistory(emptyHistory(), before, after, 'Eliminar');
    expect(() => stepHistory(history, other, 'undo', now)).toThrow('otra investigación');
    expect(before.entities).toHaveLength(12); expect(after.entities).toHaveLength(11);
  });
  it('restaura varias posiciones como una única acción', () => {
    const before = demoInvestigation();
    const after = { ...before, elements: before.elements.map(element => ({ ...element, x: element.x + 200, y: element.y + 60 })) };
    const result = stepHistory(recordHistory(emptyHistory(), before, after, 'Mover tarjetas'), after, 'undo', now)!;
    expect(result.board.elements).toEqual(before.elements); expect(result.history.past).toHaveLength(0);
    expect(stepHistory(result.history, result.board, 'redo', now)?.board.elements).toEqual(after.elements);
  });
});
