import { describe, it, expect } from 'vitest';
import { demoInvestigation } from '../domain/demo';
import { investigationSchema, evidenceFor } from '../domain/model';
import { addCard, connectCards, createInvestigation, removeCards, updateCard, updateRelation } from './actions';
const now = '2026-10-13T15:00:00.000Z';
describe('Integridad y acciones de investigación', () => {
  it('valida el tablero de inventario sin referencias huérfanas', () => { expect(investigationSchema.safeParse(demoInvestigation()).success).toBe(true); });
  it('crea un tablero vacío y asigna códigos de requisitos sin reutilizar existentes', () => {
    const empty = createInvestigation('board', ' Compras ', now); expect(empty.name).toBe('Compras'); expect(empty.entities).toHaveLength(0);
    const board = addCard(demoInvestigation(), 'requirement', 'new', now, { x: 5, y: 6 });
    expect(board.entities.find(entity => entity.id === 'new')?.requirement?.code).toBe('RF-003');
    expect(board.elements.find(element => element.nodeId === 'new')).toMatchObject({ x: 5, y: 6 });
  });
  it('elimina una tarjeta, su posición, sus relaciones y el archivo no utilizado', () => {
    const board = removeCards(demoInvestigation(), ['interview'], now);
    expect(board.entities.some(entity => entity.id === 'interview')).toBe(false);
    expect(board.elements.some(element => element.nodeId === 'interview')).toBe(false);
    expect(board.edges.some(edge => edge.sourceId === 'interview' || edge.targetId === 'interview')).toBe(false);
    expect(board.assets.some(asset => asset.id === 'interview-file')).toBe(false);
    expect(investigationSchema.safeParse(board).success).toBe(true);
  });
  it('rechaza nodos inexistentes, auto-relaciones y relaciones duplicadas', () => {
    const board = demoInvestigation();
    expect(() => connectCards(board, 'missing', 'req-trace', 'evidences', 'new', now)).toThrow();
    expect(() => connectCards(board, 'req-trace', 'req-trace', 'depends_on', 'new', now)).toThrow();
    expect(() => connectCards(board, 'interview', 'finding-trace', 'evidences', 'new', now)).toThrow();
  });
  it('permite relaciones de distinto significado y actualizarlas', () => {
    let board = connectCards(demoInvestigation(), 'interview', 'finding-stock', 'contradicts', 'new', now);
    const edge = board.edges.find(edge => edge.id === 'new'); expect(edge).toBeDefined();
    board = updateRelation(board, { ...edge!, relation: 'references', description: 'Pendiente de contrastar' }, now);
    expect(board.edges.find(edge => edge.id === 'new')?.relation).toBe('references');
  });
  it('actualiza requisitos sin modificar las posiciones', () => {
    const initial = demoInvestigation(); const entity = initial.entities.find(entity => entity.id === 'req-trace');
    const updated = updateCard(initial, { ...entity!, title: 'Auditar movimientos', updatedAt: now });
    expect(updated.elements).toEqual(initial.elements); expect(updated.entities.find(item => item.id === entity?.id)?.title).toBe('Auditar movimientos');
  });
  it('recorre evidencias transitivas y termina incluso con ciclos', () => {
    const board = connectCards(demoInvestigation(), 'req-trace', 'finding-trace', 'originates', 'cycle', now);
    expect(evidenceFor(board, 'req-trace').map(entity => entity.id).sort()).toEqual(['interview', 'spreadsheet']);
  });
  it('rechaza posiciones no finitas, IDs repetidos y URLs ejecutables', () => {
    const board = demoInvestigation();
    expect(investigationSchema.safeParse({ ...board, elements: [...board.elements, { nodeId: 'note', x: Infinity, y: 0 }] }).success).toBe(false);
    expect(investigationSchema.safeParse({ ...board, entities: [...board.entities, board.entities[0]] }).success).toBe(false);
    expect(investigationSchema.safeParse({ ...board, assets: board.assets.map(asset => ({ ...asset, url: 'javascript:alert(1)' })) }).success).toBe(false);
  });
  it('impide códigos de requisitos duplicados incluso con cambios de mayúsculas', () => {
    const board = demoInvestigation(); const entity = board.entities.find(entity => entity.id === 'req-stock');
    expect(() => updateCard(board, { ...entity!, requirement: { ...entity!.requirement!, code: 'rf-001' } })).toThrow();
  });
});
