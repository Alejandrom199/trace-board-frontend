import { codePrefixes, entityCode, investigationSchema, workspaceSchema, type CardType, type Entity, type Investigation, type Relation, type RelationType, type RequirementType, type Workspace } from '../domain/model';

const newTitles: Record<CardType, string> = {
  note: 'Nueva nota', document: 'Nuevo documento', image: 'Nueva imagen', finding: 'Nuevo hallazgo', problem: 'Nuevo problema', question: 'Nueva pregunta',
  actor: 'Nuevo actor', process: 'Nuevo proceso', business_rule: 'Nueva regla de negocio', external_system: 'Nuevo sistema externo', requirement: 'Nuevo requisito', decision: 'Nueva decisión',
};
/** Primer código libre con el prefijo, comparando con todos los tipos codificados de la investigación. */
export function nextCode(entities: Entity[], prefix: string): string {
  const codes = new Set(entities.map(entity => entityCode(entity)?.trim().toUpperCase()));
  let sequence = 1;
  while (codes.has(`${prefix}-${String(sequence).padStart(3, '0')}`)) sequence++;
  return `${prefix}-${String(sequence).padStart(3, '0')}`;
}
function defaultAttributes(kind: CardType, entities: Entity[]): Partial<Entity> {
  switch (kind) {
    case 'requirement': return { requirement: { code: nextCode(entities, codePrefixes.functional), priority: 'medium', status: 'draft', criteria: [], type: 'functional' } };
    case 'actor': return { actor: { category: 'user' } };
    case 'problem': return { problem: { severity: 'medium', status: 'open' } };
    case 'business_rule': return { businessRule: { code: nextCode(entities, codePrefixes.business_rule) } };
    case 'question': return { question: { status: 'open', answer: '' } };
    case 'decision': return { decision: { code: nextCode(entities, codePrefixes.decision), status: 'proposed', rationale: '' } };
    default: return {};
  }
}
/** Cambia entre RF y RNF; renumera solo los códigos con formato automático para respetar los editados a mano. */
export function withRequirementType(board: Investigation, entity: Entity, type: RequirementType): Entity {
  if (!entity.requirement || entity.requirement.type === type) return entity;
  const automatic = /^(RF|RNF)-\d+$/i.test(entity.requirement.code.trim());
  const code = automatic ? nextCode(board.entities.filter(item => item.id !== entity.id), codePrefixes[type]) : entity.requirement.code;
  return { ...entity, requirement: { ...entity.requirement, type, code, category: type === 'non_functional' ? entity.requirement.category ?? 'performance' : undefined } };
}

export function createInvestigation(id: string, name: string, now: string): Investigation {
  return investigationSchema.parse({ id, name: name.trim(), description: '', createdAt: now, updatedAt: now, entities: [], edges: [], elements: [], assets: [] });
}
/** Quita una investigación del espacio local; si era la activa, abre la primera restante. */
export function removeInvestigation(workspace: Workspace, id: string): Workspace {
  const investigations = workspace.investigations.filter(item => item.id !== id);
  if (investigations.length === workspace.investigations.length) throw new Error('La investigación ya no existe');
  const [first] = investigations;
  if (!first) throw new Error('Debe quedar al menos una investigación');
  return workspaceSchema.parse({ ...workspace, investigations, activeId: workspace.activeId === id ? first.id : workspace.activeId });
}
export function addCard(board: Investigation, kind: CardType, id: string, now: string, position: { x: number; y: number }): Investigation {
  const entity: Entity = { id, kind, title: newTitles[kind], description: '', createdAt: now, updatedAt: now, ...defaultAttributes(kind, board.entities) };
  return investigationSchema.parse({ ...board, updatedAt: now, entities: [...board.entities, entity], elements: [...board.elements, { nodeId: id, ...position }] });
}
export function updateCard(board: Investigation, entity: Entity): Investigation {
  if (!board.entities.some(item => item.id === entity.id)) throw new Error('La tarjeta ya no existe');
  return investigationSchema.parse({ ...board, updatedAt: entity.updatedAt, entities: board.entities.map(item => item.id === entity.id ? entity : item) });
}
export function removeCards(board: Investigation, ids: string[], now: string): Investigation {
  const entities = board.entities.filter(entity => !ids.includes(entity.id));
  return { ...board, updatedAt: now, entities, elements: board.elements.filter(element => !ids.includes(element.nodeId)),
    edges: board.edges.filter(edge => !ids.includes(edge.sourceId) && !ids.includes(edge.targetId)),
    assets: board.assets.filter(asset => entities.some(entity => entity.assetId === asset.id)),
  };
}
export function connectCards(board: Investigation, sourceId: string, targetId: string, relation: RelationType, id: string, now: string): Investigation {
  const edge: Relation = { id, sourceId, targetId, relation, description: '', metadata: {}, createdAt: now };
  return investigationSchema.parse({ ...board, updatedAt: now, edges: [...board.edges, edge] });
}
export function updateRelation(board: Investigation, edge: Relation, now: string): Investigation {
  if (!board.edges.some(item => item.id === edge.id)) throw new Error('La relación ya no existe');
  return investigationSchema.parse({ ...board, updatedAt: now, edges: board.edges.map(item => item.id === edge.id ? edge : item) });
}
