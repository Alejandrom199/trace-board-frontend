import { createInvestigationRequestSchema, investigationDtoSchema, investigationListSchema, boardContentSchema, boardDtoSchema, saveBoardRequestSchema, type BoardContentDto, type BoardDto, type CreateInvestigationRequest, type InvestigationDto } from '@traceboard/contracts';
import type { z } from 'zod';
import { investigationSchema, type Investigation } from '../domain/model';
function validated<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new Error('La API devolvió datos inválidos. Vuelve a intentarlo.');
  return parsed.data;
}
async function request(path: string, init?: RequestInit): Promise<unknown> {
  let response: Response;
  try { response = await fetch('/api/investigations' + path, { ...init, signal: AbortSignal.timeout(8000), cache: 'no-store' }); }
  catch { throw new Error('No se pudo conectar con la API. Comprueba que el backend esté iniciado.'); }
  if (!response.ok) {
    if (response.status === 404) throw new Error('La investigación ya no está disponible en la base de datos.');
    if (response.status === 400) throw new Error('Revisa el nombre y la descripción de la investigación.');
    if (response.status === 409) throw new Error('Otra sesión guardó una versión más reciente. Tu copia local se conserva; reabre desde Base de datos antes de guardar.');
    if (response.status === 413) throw new Error('El tablero supera el límite remoto de 8 MB. Tu copia local se conserva.');
    throw new Error('La base de datos no está disponible. Puedes continuar con tus investigaciones locales.');
  }
  try { return await response.json(); }
  catch { throw new Error('La API devolvió una respuesta inválida. Vuelve a intentarlo.'); }
}
export async function listRemoteInvestigations(): Promise<InvestigationDto[]> { return validated(investigationListSchema, await request('')); }
export async function createRemoteInvestigation(input: CreateInvestigationRequest): Promise<InvestigationDto> {
  const parsed = createInvestigationRequestSchema.parse(input);
  return validated(investigationDtoSchema, await request('', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed) }));
}
export async function openRemoteInvestigation(id: string): Promise<InvestigationDto> { return validated(investigationDtoSchema, await request('/' + encodeURIComponent(id))); }
export async function openRemoteBoard(id: string): Promise<BoardDto> {
  const dto = validated(boardDtoSchema, await request('/' + encodeURIComponent(id) + '/board'));
  // The local model also checks referential integrity before UI hydration.
  if (dto.content) validated(investigationSchema, { ...dto.investigation, ...dto.content });
  return dto;
}
export function remoteContent(board: Investigation): BoardContentDto {
  return boardContentSchema.parse({
    entities: board.entities, edges: board.edges, elements: board.elements, viewport: board.viewport,
    assets: board.assets.map(({ id, name, mime, size, remoteFile }) => ({ id, name, mime, size, ...(remoteFile?.investigationId === board.id ? { file: { id: remoteFile.id, sha256: remoteFile.sha256 } } : {}) })),
  });
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value !== null && typeof value === 'object') return '{' + Object.entries(value).filter(([, value]) => value !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => JSON.stringify(key) + ':' + canonical(value)).join(',') + '}';
  return JSON.stringify(value) ?? 'null';
}
export async function contentFingerprint(content: BoardContentDto): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(content)));
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
}
export async function saveRemoteBoard(id: string, expectedRevision: number, content: BoardContentDto): Promise<BoardDto> {
  const input = saveBoardRequestSchema.parse({ expectedRevision, content });
  const body = JSON.stringify(input);
  if (new TextEncoder().encode(body).byteLength > 8 * 1024 * 1024) throw new Error('El tablero supera el límite remoto de 8 MB. Tu copia local se conserva.');
  return validated(boardDtoSchema, await request('/' + encodeURIComponent(id) + '/board', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body }));
}
/** Preserve a different local draft before replacing a board with its remote version. */
export async function projectRemoteBoard(dto: BoardDto, existing: Investigation | undefined, copyId: string): Promise<{ board: Investigation; draft?: Investigation }> {
  const content = dto.content ?? { entities: [], edges: [], elements: [], assets: [] };
  const fingerprint = await contentFingerprint(content);
  if (!dto.content && existing) return { board: investigationSchema.parse({ ...existing, ...dto.investigation, remote: { revision: dto.revision, fingerprint } }) };
  const same = !existing || await contentFingerprint(remoteContent(existing)) === fingerprint;
  const assets = content.assets.map(asset => {
    const local = existing?.assets.find(item => item.id === asset.id && item.name === asset.name && item.mime === asset.mime && item.size === asset.size);
    const remoteFile = asset.file ? { ...asset.file, investigationId: dto.investigation.id } : undefined;
    return { ...asset, ...(local?.url && (!remoteFile || local.remoteFile?.sha256 === remoteFile.sha256) ? { url: local.url } : {}), ...(remoteFile ? { remoteFile } : {}) };
  });
  const board = investigationSchema.parse({ ...dto.investigation, ...content, assets, remote: { revision: dto.revision, fingerprint } });
  const draft = existing && !same ? investigationSchema.parse({ ...existing, id: copyId, name: (existing.name + ' (copia local)').slice(0, 120), remote: undefined }) : undefined;
  return { board, draft };
}
