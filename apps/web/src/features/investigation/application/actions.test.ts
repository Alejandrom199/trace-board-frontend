import { describe, it, expect } from 'vitest';
import { demoInvestigation } from '../domain/demo';
import { investigationSchema, evidenceFor, cardTypes, entitySchema } from '../domain/model';
import { addCard, connectCards, createInvestigation, removeCards, removeInvestigation, updateCard, updateRelation, withRequirementType } from './actions';
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
  it('elimina una investigación, cambia la activa y conserva al menos una', () => {
    const other = createInvestigation('other', 'Compras', now);
    const workspace = { version: 1 as const, activeId: 'inventory', investigations: [demoInvestigation(), other] };
    const result = removeInvestigation(workspace, 'inventory');
    expect(result.investigations.map(item => item.id)).toEqual(['other']); expect(result.activeId).toBe('other');
    expect(removeInvestigation(workspace, 'other').activeId).toBe('inventory');
    expect(() => removeInvestigation(result, 'other')).toThrow('al menos una');
    expect(() => removeInvestigation(workspace, 'missing')).toThrow('ya no existe');
  });
  it('crea cada tipo con sus atributos y códigos propios sin chocar con los existentes', () => {
    let board = demoInvestigation();
    for (const kind of cardTypes) board = addCard(board, kind, `new-${kind}`, now, { x: 0, y: 0 });
    const created = (kind: string) => board.entities.find(entity => entity.id === `new-${kind}`);
    expect(created('business_rule')?.businessRule?.code).toBe('RN-002');
    expect(created('decision')?.decision).toEqual({ code: 'DEC-001', status: 'proposed', rationale: '' });
    expect(created('requirement')?.requirement).toMatchObject({ code: 'RF-003', type: 'functional' });
    expect(created('problem')?.problem).toEqual({ severity: 'medium', status: 'open' });
    expect(created('question')?.title).toBe('Nueva pregunta'); expect(created('external_system')?.title).toBe('Nuevo sistema externo');
  });
  it('exige los atributos de cada tipo y rechaza los de otro tipo', () => {
    const base = { id: 'x', title: 'Tarjeta', description: '', createdAt: now, updatedAt: now };
    expect(entitySchema.safeParse({ ...base, kind: 'actor', actor: { category: 'area' } }).success).toBe(true);
    expect(entitySchema.safeParse({ ...base, kind: 'problem' }).success).toBe(false);
    expect(entitySchema.safeParse({ ...base, kind: 'note', actor: { category: 'user' } }).success).toBe(false);
    expect(entitySchema.safeParse({ ...base, kind: 'external_system' }).success).toBe(true);
    const requirement = { code: 'RF-009', priority: 'low', status: 'draft', criteria: [] };
    expect(entitySchema.safeParse({ ...base, kind: 'requirement', requirement: { ...requirement, type: 'functional', category: 'security' } }).success).toBe(false);
    expect(entitySchema.safeParse({ ...base, kind: 'requirement', requirement: { ...requirement, type: 'non_functional' } }).success).toBe(false);
  });
  it('interpreta como funcionales los requisitos guardados sin tipo', () => {
    const legacy = entitySchema.parse({ id: 'x', kind: 'requirement', title: 'Antiguo', description: '', createdAt: now, updatedAt: now, requirement: { code: 'RF-009', priority: 'low', status: 'draft', criteria: [] } });
    expect(legacy.requirement?.type).toBe('functional'); expect(legacy.requirement?.category).toBeUndefined();
  });
  it('impide códigos repetidos entre requisitos, reglas y decisiones', () => {
    const board = demoInvestigation(); const rule = board.entities.find(entity => entity.id === 'rule-stock');
    expect(() => updateCard(board, { ...rule!, businessRule: { code: 'rf-001' } })).toThrow();
  });
  it('cambia entre RF y RNF renumerando solo los códigos automáticos', () => {
    const board = addCard(demoInvestigation(), 'requirement', 'new', now, { x: 0, y: 0 });
    const entity = board.entities.find(item => item.id === 'new')!;
    const nonFunctional = withRequirementType(board, entity, 'non_functional');
    expect(nonFunctional.requirement).toMatchObject({ code: 'RNF-001', type: 'non_functional', category: 'performance' });
    const functional = withRequirementType(board, nonFunctional, 'functional');
    expect(functional.requirement?.code).toBe('RF-003'); expect(functional.requirement?.category).toBeUndefined();
    const manual = withRequirementType(board, { ...entity, requirement: { ...entity.requirement!, code: 'INV-7' } }, 'non_functional');
    expect(manual.requirement?.code).toBe('INV-7');
    expect(investigationSchema.safeParse(updateCard(board, nonFunctional)).success).toBe(true);
  });
});
