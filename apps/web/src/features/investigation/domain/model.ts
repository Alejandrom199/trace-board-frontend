import { z } from 'zod';
import { MAX_FILE_BYTES, MAX_ASSET_URL_LENGTH } from './limits';

export const cardTypes = ['note', 'document', 'image', 'finding', 'problem', 'question', 'actor', 'process', 'business_rule', 'external_system', 'requirement', 'decision'] as const;
export const relationTypes = ['evidences', 'depends_on', 'contradicts', 'originates', 'affects', 'implements', 'references', 'related_to', 'performs', 'answers'] as const;
export const relationLabels: Record<RelationType, string> = {
  evidences: 'Evidencia', depends_on: 'Depende de', contradicts: 'Contradice', originates: 'Origina',
  affects: 'Afecta', implements: 'Implementa', references: 'Referencia', related_to: 'Se relaciona con',
  performs: 'Ejecuta', answers: 'Responde',
};
export const cardLabels: Record<CardType, string> = {
  note: 'Nota', document: 'Documento', image: 'Imagen', finding: 'Hallazgo', problem: 'Problema', question: 'Pregunta', actor: 'Actor',
  process: 'Proceso', business_rule: 'Regla de negocio', external_system: 'Sistema externo', requirement: 'Requisito', decision: 'Decisión',
};
/** Agrupación de los tipos para crearlos según la etapa del análisis. */
export const cardGroups: { label: string; types: CardType[] }[] = [
  { label: 'Fuentes', types: ['note', 'document', 'image'] }, { label: 'Análisis', types: ['finding', 'problem', 'question'] },
  { label: 'Negocio', types: ['actor', 'process', 'business_rule', 'external_system'] }, { label: 'Solución', types: ['requirement', 'decision'] },
];
export const priorities = ['low', 'medium', 'high', 'critical'] as const;
export const requirementTypes = ['functional', 'non_functional'] as const;
/** Características de calidad de ISO/IEC 25010 para requisitos no funcionales. */
export const qualityCategories = ['performance', 'security', 'usability', 'reliability', 'compatibility', 'maintainability', 'portability', 'other'] as const;
export const actorCategories = ['user', 'stakeholder', 'area'] as const;
export const problemStatuses = ['open', 'resolved'] as const;
export const questionStatuses = ['open', 'answered', 'discarded'] as const;
export const decisionStatuses = ['proposed', 'accepted', 'rejected', 'superseded'] as const;
/** Prefijo del código que identifica cada tipo codificado dentro de una investigación. */
export const codePrefixes = { functional: 'RF', non_functional: 'RNF', business_rule: 'RN', decision: 'DEC' } as const;
/** Cada tipo con atributos estructurados y la propiedad que los contiene; los demás tipos no admiten ninguna. */
const attributeKeys = [['requirement', 'requirement'], ['actor', 'actor'], ['problem', 'problem'], ['business_rule', 'businessRule'], ['question', 'question'], ['decision', 'decision']] as const;
const id = z.string().min(1).max(100);
const code = z.string().min(1).max(40);
const timestamp = z.iso.datetime();
export const assetSchema = z.object({
  id, name: z.string().min(1).max(250), mime: z.string().max(100), size: z.number().int().min(0).max(MAX_FILE_BYTES),
  url: z.string().max(MAX_ASSET_URL_LENGTH).refine(value => /^\/demo\/[a-z0-9-]+\.svg$/.test(value) || /^data:(image\/(png|jpeg|webp|gif)|application\/pdf);base64,[A-Za-z0-9+/=]+$/.test(value), 'Archivo de previsualización no permitido').optional(),
  remoteFile: z.object({ id: z.uuid(), investigationId: z.uuid(), sha256: z.string().regex(/^[a-f0-9]{64}$/) }).optional(),
});
export const entitySchema = z.object({
  id, kind: z.enum(cardTypes), title: z.string().min(1).max(200), description: z.string().max(10000),
  createdAt: timestamp, updatedAt: timestamp, assetId: id.optional(),
  requirement: z.object({
    code, priority: z.enum(priorities), status: z.enum(['draft', 'review', 'approved', 'rejected']), criteria: z.array(z.string().max(1000)).max(40),
    // Los requisitos guardados antes de distinguir RF/RNF se interpretan como funcionales.
    type: z.enum(requirementTypes).default('functional'), category: z.enum(qualityCategories).optional(),
  }).optional(),
  actor: z.object({ category: z.enum(actorCategories) }).optional(),
  problem: z.object({ severity: z.enum(priorities), status: z.enum(problemStatuses) }).optional(),
  businessRule: z.object({ code }).optional(),
  question: z.object({ status: z.enum(questionStatuses), answer: z.string().max(5000) }).optional(),
  decision: z.object({ code, status: z.enum(decisionStatuses), rationale: z.string().max(5000) }).optional(),
}).superRefine((entity, ctx) => {
  for (const [kind, key] of attributeKeys) {
    if ((entity.kind === kind) !== (entity[key] !== undefined)) ctx.addIssue({ code: 'custom', message: `Propiedades de ${cardLabels[kind].toLowerCase()} ausentes o en un tipo incorrecto` });
  }
  if (entity.requirement && (entity.requirement.type === 'non_functional') !== (entity.requirement.category !== undefined)) ctx.addIssue({ code: 'custom', message: 'Solo los requisitos no funcionales tienen categoría de calidad' });
});
export const edgeSchema = z.object({
  id, sourceId: id, targetId: id, relation: z.enum(relationTypes), description: z.string().max(2000),
  createdAt: timestamp, metadata: z.record(z.string().max(100), z.string().max(500)),
});
export const investigationSchema = z.object({
  id, name: z.string().min(1).max(120), description: z.string().max(2000), createdAt: timestamp, updatedAt: timestamp,
  entities: z.array(entitySchema).max(500), edges: z.array(edgeSchema).max(2000), assets: z.array(assetSchema).max(500),
  elements: z.array(z.object({ nodeId: id, x: z.number().finite().min(-1e7).max(1e7), y: z.number().finite().min(-1e7).max(1e7) })).max(500),
  viewport: z.object({ x: z.number().finite().min(-1e7).max(1e7), y: z.number().finite().min(-1e7).max(1e7), zoom: z.number().min(0.15).max(2) }).optional(),
  remote: z.object({ revision: z.number().int().min(0).max(2147483646), fingerprint: z.string().regex(/^[a-f0-9]{64}$/) }).optional(),
}).superRefine((board, ctx) => {
  const nodes = new Set(board.entities.map(node => node.id));
  const assets = new Set(board.assets.map(asset => asset.id));
  const codes = board.entities.flatMap(entity => { const value = entityCode(entity); return value === undefined ? [] : [value.trim().toUpperCase()]; });
  if (codes.some(code => !code) || new Set(codes).size !== codes.length) ctx.addIssue({ code: 'custom', message: 'Códigos vacíos o duplicados' });
  if (nodes.size !== board.entities.length || assets.size !== board.assets.length || new Set(board.edges.map(edge => edge.id)).size !== board.edges.length) ctx.addIssue({ code: 'custom', message: 'Identificadores duplicados' });
  if (board.elements.length !== nodes.size || new Set(board.elements.map(element => element.nodeId)).size !== nodes.size || board.elements.some(element => !nodes.has(element.nodeId))) ctx.addIssue({ code: 'custom', message: 'Posiciones incoherentes' });
  if (board.entities.some(node => node.assetId && !assets.has(node.assetId))) ctx.addIssue({ code: 'custom', message: 'Archivo inexistente' });
  const pairs = new Set<string>();
  for (const edge of board.edges) {
    const key = JSON.stringify([edge.sourceId, edge.targetId, edge.relation]);
    if (!nodes.has(edge.sourceId) || !nodes.has(edge.targetId) || edge.sourceId === edge.targetId || pairs.has(key)) ctx.addIssue({ code: 'custom', message: 'Relación inválida o duplicada' });
    pairs.add(key);
  }
});
export const workspaceSchema = z.object({ version: z.literal(1), activeId: id, investigations: z.array(investigationSchema).min(1).max(30) }).superRefine((workspace, ctx) => {
  if (!workspace.investigations.some(board => board.id === workspace.activeId) || new Set(workspace.investigations.map(board => board.id)).size !== workspace.investigations.length) ctx.addIssue({ code: 'custom', message: 'Investigación activa inválida o IDs duplicados' });
});
export type CardType = typeof cardTypes[number];
export type RelationType = typeof relationTypes[number];
export type RequirementType = typeof requirementTypes[number];
export type Entity = z.infer<typeof entitySchema>;
export type Relation = z.infer<typeof edgeSchema>;
export type Asset = z.infer<typeof assetSchema>;
export type Investigation = z.infer<typeof investigationSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;

/** Código visible de requisitos, reglas de negocio y decisiones; los demás tipos no tienen. */
export function entityCode(entity: Pick<Entity, 'requirement' | 'businessRule' | 'decision'>): string | undefined {
  return entity.requirement?.code ?? entity.businessRule?.code ?? entity.decision?.code;
}

/** Fuentes que sustentan un nodo a través de evidencias y hallazgos, sin ciclos. */
export function evidenceFor(board: Investigation, nodeId: string): Entity[] {
  const visited = new Set([nodeId]);
  const sources: Entity[] = [];
  const pending = [nodeId];
  while (pending.length) {
    const current = pending.pop();
    for (const edge of board.edges) {
      if (edge.targetId !== current || !['evidences', 'originates'].includes(edge.relation) || visited.has(edge.sourceId)) continue;
      visited.add(edge.sourceId);
      const entity = board.entities.find(item => item.id === edge.sourceId);
      if (!entity) continue;
      if (['document', 'image', 'note'].includes(entity.kind)) sources.push(entity);
      pending.push(entity.id);
    }
  }
  return sources;
}
