import { cardLabels, investigationSchema, type CardType, type Entity, type Investigation, type Relation, type RelationType } from '../domain/model';

export function createInvestigation(id: string, name: string, now: string): Investigation {
  return investigationSchema.parse({ id, name: name.trim(), description: '', createdAt: now, updatedAt: now, entities: [], edges: [], elements: [], assets: [] });
}
export function addCard(board: Investigation, kind: CardType, id: string, now: string, position: { x: number; y: number }): Investigation {
  const codes = new Set(board.entities.map(entity => entity.requirement?.code));
  let sequence = 1;
  while (codes.has(`RF-${String(sequence).padStart(3, '0')}`)) sequence++;
  const entity: Entity = { id, kind, title: `Nueva ${cardLabels[kind].toLowerCase()}`, description: '', createdAt: now, updatedAt: now,
    ...(kind === 'requirement' ? { title: 'Nuevo requisito', requirement: { code: `RF-${String(sequence).padStart(3, '0')}`, priority: 'medium', status: 'draft', criteria: [] } } : {}),
  };
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
