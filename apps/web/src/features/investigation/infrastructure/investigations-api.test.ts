import { afterEach, describe, expect, it, vi } from 'vitest';
import { contentFingerprint, listRemoteInvestigations, openRemoteInvestigation, projectRemoteBoard, remoteContent, saveRemoteBoard } from './investigations-api';
import { demoInvestigation } from '../domain/demo';
import type { BoardDto } from '@traceboard/contracts';
afterEach(() => vi.unstubAllGlobals());
describe('Adaptador HTTP de investigaciones', () => {
  it('recupera metadatos válidos sin tipos del backend', async () => {
    const dto = { id: '977d38bd-1bde-4823-bd3c-3fb5d32901e5', name: 'Compras', description: '', createdAt: '2026-10-13T18:00:00.000Z', updatedAt: '2026-10-13T18:00:00.000Z' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(dto))));
    expect(await openRemoteInvestigation(dto.id)).toEqual(dto);
  });
  it('explica la indisponibilidad y la ausencia de una investigación', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 503 })));
    await expect(listRemoteInvestigations()).rejects.toThrow('base de datos no está disponible');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 404 })));
    await expect(openRemoteInvestigation('missing')).rejects.toThrow('ya no está disponible');
  });
  it('rechaza respuestas malformadas con mensajes de producto', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')));
    await expect(listRemoteInvestigations()).rejects.toThrow('datos inválidos');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not json')));
    await expect(listRemoteInvestigations()).rejects.toThrow('respuesta inválida');
  });
});
describe('Proyección y guardado del tablero remoto', () => {
  const local = () => ({ ...demoInvestigation(), id: '977d38bd-1bde-4823-bd3c-3fb5d32901e5' });
  const remote = (): BoardDto => {
    const board = local();
    return { investigation: { id: board.id, name: board.name, description: board.description, createdAt: board.createdAt, updatedAt: board.updatedAt }, revision: 1, content: remoteContent(board) };
  };
  it('envía metadatos de archivos, sin URLs ni binarios', async () => {
    const board = local(); board.assets[0]!.url = 'data:application/pdf;base64,AAAA';
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(remote()))); vi.stubGlobal('fetch', fetch);
    await saveRemoteBoard(board.id, 0, remoteContent(board));
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/board'), expect.objectContaining({ method: 'PUT' }));
    const init = fetch.mock.calls[0]?.[1]; expect(init.body).not.toContain('base64'); expect(init.body).not.toContain('"url"');
  });
  it('conserva un borrador diferente y sus archivos locales al abrir remoto', async () => {
    const board = local(); board.entities[0]!.title = 'Borrador pendiente';
    const result = await projectRemoteBoard(remote(), board, 'copy');
    expect(result.draft?.id).toBe('copy'); expect(result.draft?.entities[0]?.title).toBe('Borrador pendiente'); expect(result.draft?.remote).toBeUndefined();
    expect(result.board.assets[0]?.url).toBe(board.assets[0]?.url); expect(result.board.remote?.revision).toBe(1);
  });
  it('abre en una sesión nueva sin simular que se recuperaron archivos', async () => {
    const result = await projectRemoteBoard(remote(), undefined, 'copy');
    expect(result.board.entities).toHaveLength(12); expect(result.board.edges).toHaveLength(12);
    expect(result.board.assets.every(asset => asset.url === undefined)).toBe(true); expect(result.draft).toBeUndefined();
  });
  it('no crea copias por el orden de claves JSONB', async () => {
    const dto = remote(); dto.content!.edges[0]!.metadata = { a: 'one', b: 'two' };
    const board = local(); board.edges[0]!.metadata = { b: 'two', a: 'one' };
    expect(await contentFingerprint(remoteContent(board))).toBe(await contentFingerprint(dto.content!));
    expect((await projectRemoteBoard(dto, board, 'copy')).draft).toBeUndefined();
  });
  it('explica conflictos sin anunciar éxito', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 409 })));
    await expect(saveRemoteBoard(local().id, 0, remoteContent(local()))).rejects.toThrow('Tu copia local se conserva');
  });
});
