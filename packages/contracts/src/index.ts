import { z } from 'zod';
export const createInvestigationRequestSchema = z.strictObject({ name: z.string().trim().min(1).max(120), description: z.string().max(2000).default('') });
export const investigationDtoSchema = z.strictObject({ id: z.uuid(), name: z.string().min(1).max(120), description: z.string().max(2000), createdAt: z.iso.datetime(), updatedAt: z.iso.datetime() });
export const investigationListSchema = z.array(investigationDtoSchema).max(500);
export type CreateInvestigationRequest = z.infer<typeof createInvestigationRequestSchema>;
export type InvestigationDto = z.infer<typeof investigationDtoSchema>;

const boardId = z.string().min(1).max(100);
export const remoteFileReferenceSchema = z.strictObject({ id: z.uuid(), sha256: z.string().regex(/^[a-f0-9]{64}$/) });
export const fileDtoSchema = z.strictObject({ id: z.uuid(), investigationId: z.uuid(), name: z.string().min(1).max(250), mime: z.enum(['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp']), size: z.number().int().min(1).max(10 * 1024 * 1024), sha256: z.string().regex(/^[a-f0-9]{64}$/), createdAt: z.iso.datetime() });
export type FileDto = z.infer<typeof fileDtoSchema>;
export const boardContentSchema = z.strictObject({
  entities: z.array(z.strictObject({
    id: boardId, kind: z.enum(['note', 'document', 'image', 'finding', 'requirement', 'process']),
    title: z.string().trim().min(1).max(200), description: z.string().max(10000),
    createdAt: z.iso.datetime(), updatedAt: z.iso.datetime(), assetId: boardId.optional(),
    requirement: z.strictObject({ code: z.string().trim().min(1).max(40), priority: z.enum(['low', 'medium', 'high', 'critical']), status: z.enum(['draft', 'review', 'approved', 'rejected']), criteria: z.array(z.string().max(1000)).max(40) }).optional(),
  })).max(500),
  edges: z.array(z.strictObject({ id: boardId, sourceId: boardId, targetId: boardId, relation: z.enum(['evidences', 'depends_on', 'contradicts', 'originates', 'affects', 'implements', 'references', 'related_to']), description: z.string().max(2000), createdAt: z.iso.datetime(), metadata: z.record(z.string().max(100), z.string().max(500)).refine(value => Object.keys(value).length <= 40) })).max(2000),
  assets: z.array(z.strictObject({ id: boardId, name: z.string().min(1).max(250), mime: z.string().max(100), size: z.number().int().min(0).max(10 * 1024 * 1024), file: remoteFileReferenceSchema.optional() })).max(500),
  elements: z.array(z.strictObject({ nodeId: boardId, x: z.number().finite().min(-1e7).max(1e7), y: z.number().finite().min(-1e7).max(1e7) })).max(500),
  viewport: z.strictObject({ x: z.number().finite().min(-1e7).max(1e7), y: z.number().finite().min(-1e7).max(1e7), zoom: z.number().min(0.15).max(2) }).optional(),
});
export const boardDtoSchema = z.strictObject({ investigation: investigationDtoSchema, revision: z.number().int().min(0).max(2147483646), content: boardContentSchema.nullable() });
export const saveBoardRequestSchema = z.strictObject({ expectedRevision: z.number().int().min(0).max(2147483645), content: boardContentSchema });
export type BoardContentDto = z.infer<typeof boardContentSchema>;
export type BoardDto = z.infer<typeof boardDtoSchema>;
