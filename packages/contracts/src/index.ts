import { z } from 'zod';
export const createInvestigationRequestSchema = z.strictObject({ name: z.string().trim().min(1).max(120), description: z.string().max(2000).default('') });
export const investigationDtoSchema = z.strictObject({ id: z.uuid(), name: z.string().min(1).max(120), description: z.string().max(2000), createdAt: z.iso.datetime(), updatedAt: z.iso.datetime() });
export const investigationListSchema = z.array(investigationDtoSchema).max(500);
export type CreateInvestigationRequest = z.infer<typeof createInvestigationRequestSchema>;
export type InvestigationDto = z.infer<typeof investigationDtoSchema>;

const boardId = z.string().min(1).max(100);
const code = z.string().trim().min(1).max(40);
const priority = z.enum(['low', 'medium', 'high', 'critical']);
export const remoteFileReferenceSchema = z.strictObject({ id: z.uuid(), sha256: z.string().regex(/^[a-f0-9]{64}$/) });
export const fileDtoSchema = z.strictObject({ id: z.uuid(), investigationId: z.uuid(), name: z.string().min(1).max(250), mime: z.enum(['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp']), size: z.number().int().min(1).max(10 * 1024 * 1024), sha256: z.string().regex(/^[a-f0-9]{64}$/), createdAt: z.iso.datetime() });
export type FileDto = z.infer<typeof fileDtoSchema>;
export const boardContentSchema = z.strictObject({
  entities: z.array(z.strictObject({
    id: boardId, kind: z.enum(['note', 'document', 'image', 'finding', 'problem', 'question', 'actor', 'process', 'business_rule', 'external_system', 'requirement', 'decision']),
    title: z.string().trim().min(1).max(200), description: z.string().max(10000),
    createdAt: z.iso.datetime(), updatedAt: z.iso.datetime(), assetId: boardId.optional(),
    requirement: z.strictObject({
      code, priority, status: z.enum(['draft', 'review', 'approved', 'rejected']), criteria: z.array(z.string().max(1000)).max(40),
      // Contenido guardado con la versión 0.1.0 no distingue RF/RNF: se interpreta como funcional.
      type: z.enum(['functional', 'non_functional']).default('functional'),
      category: z.enum(['performance', 'security', 'usability', 'reliability', 'compatibility', 'maintainability', 'portability', 'other']).optional(),
    }).optional(),
    actor: z.strictObject({ category: z.enum(['user', 'stakeholder', 'area']) }).optional(),
    problem: z.strictObject({ severity: priority, status: z.enum(['open', 'resolved']) }).optional(),
    businessRule: z.strictObject({ code }).optional(),
    question: z.strictObject({ status: z.enum(['open', 'answered', 'discarded']), answer: z.string().max(5000) }).optional(),
    decision: z.strictObject({ code, status: z.enum(['proposed', 'accepted', 'rejected', 'superseded']), rationale: z.string().max(5000) }).optional(),
  })).max(500),
  edges: z.array(z.strictObject({ id: boardId, sourceId: boardId, targetId: boardId, relation: z.enum(['evidences', 'depends_on', 'contradicts', 'originates', 'affects', 'implements', 'references', 'related_to', 'performs', 'answers']), description: z.string().max(2000), createdAt: z.iso.datetime(), metadata: z.record(z.string().max(100), z.string().max(500)).refine(value => Object.keys(value).length <= 40) })).max(2000),
  assets: z.array(z.strictObject({ id: boardId, name: z.string().min(1).max(250), mime: z.string().max(100), size: z.number().int().min(0).max(10 * 1024 * 1024), file: remoteFileReferenceSchema.optional() })).max(500),
  elements: z.array(z.strictObject({ nodeId: boardId, x: z.number().finite().min(-1e7).max(1e7), y: z.number().finite().min(-1e7).max(1e7) })).max(500),
  viewport: z.strictObject({ x: z.number().finite().min(-1e7).max(1e7), y: z.number().finite().min(-1e7).max(1e7), zoom: z.number().min(0.15).max(2) }).optional(),
});
export const boardDtoSchema = z.strictObject({ investigation: investigationDtoSchema, revision: z.number().int().min(0).max(2147483646), content: boardContentSchema.nullable() });
export const saveBoardRequestSchema = z.strictObject({ expectedRevision: z.number().int().min(0).max(2147483645), content: boardContentSchema });
export type BoardContentDto = z.infer<typeof boardContentSchema>;
export type BoardDto = z.infer<typeof boardDtoSchema>;

/** Generación de flujo con IA: tipos de tarjeta que la IA puede proponer a partir de un documento.
 * Se excluyen note/document/image porque representan fuentes subidas por la persona, no contenido inventado. */
export const aiProposableKinds = ['finding', 'problem', 'question', 'actor', 'process', 'business_rule', 'external_system', 'requirement', 'decision'] as const;
export const aiRelationTypes = ['evidences', 'depends_on', 'contradicts', 'originates', 'affects', 'implements', 'references', 'related_to', 'performs', 'answers'] as const;
const ref = z.string().trim().min(1).max(20);
export const aiProposedEntitySchema = z.strictObject({
  ref, kind: z.enum(aiProposableKinds), title: z.string().trim().min(1).max(200), description: z.string().max(2000).default(''),
  actor: z.strictObject({ category: z.enum(['user', 'stakeholder', 'area']) }).optional(),
  requirement: z.strictObject({ type: z.enum(['functional', 'non_functional']) }).optional(),
  problem: z.strictObject({ severity: priority }).optional(),
}).superRefine((entity, ctx) => {
  if ((entity.kind === 'actor') !== Boolean(entity.actor)) ctx.addIssue({ code: 'custom', message: 'Un actor propuesto necesita categoría y ningún otro tipo la admite' });
  if ((entity.kind === 'requirement') !== Boolean(entity.requirement)) ctx.addIssue({ code: 'custom', message: 'Un requisito propuesto necesita tipo y ningún otro tipo lo admite' });
  if ((entity.kind === 'problem') !== Boolean(entity.problem)) ctx.addIssue({ code: 'custom', message: 'Un problema propuesto necesita severidad y ningún otro tipo la admite' });
});
export const aiProposedRelationSchema = z.strictObject({ from: ref, to: ref, relation: z.enum(aiRelationTypes), flow: z.boolean().default(false) });
export const aiGeneratedFlowSchema = z.strictObject({
  entities: z.array(aiProposedEntitySchema).min(1).max(40), relations: z.array(aiProposedRelationSchema).max(80),
}).superRefine((flow, ctx) => {
  const refs = new Set(flow.entities.map(entity => entity.ref));
  if (refs.size !== flow.entities.length) ctx.addIssue({ code: 'custom', message: 'Referencias de entidad repetidas' });
  for (const relation of flow.relations) if (!refs.has(relation.from) || !refs.has(relation.to) || relation.from === relation.to) ctx.addIssue({ code: 'custom', message: 'Relación con referencias inexistentes o repetidas' });
});
export const aiGenerateFlowResponseSchema = z.strictObject({ flow: aiGeneratedFlowSchema, truncated: z.boolean() });
export type AiProposedEntity = z.infer<typeof aiProposedEntitySchema>;
export type AiProposedRelation = z.infer<typeof aiProposedRelationSchema>;
export type AiGeneratedFlow = z.infer<typeof aiGeneratedFlowSchema>;
export type AiGenerateFlowResponse = z.infer<typeof aiGenerateFlowResponseSchema>;
