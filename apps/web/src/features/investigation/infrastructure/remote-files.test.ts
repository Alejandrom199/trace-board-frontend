import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { demoInvestigation } from '../domain/demo';
import { assetSource, downloadRemoteFile, uploadBoardFiles } from './remote-files';
import { remoteContent } from './investigations-api';
import type { Asset } from '../domain/model';
const nativeFetch = globalThis.fetch;
const id = '977d38bd-1bde-4823-bd3c-3fb5d32901e5';
const fileId = 'dfdc8943-7f0e-47cf-99d2-8f6eec101614';
const bytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jO1sAAAAASUVORK5CYII=', 'base64');
const sha256 = createHash('sha256').update(bytes).digest('hex');
const asset = (): Asset => ({ id: 'image', name: 'evidencia.png', mime: 'image/png', size: bytes.length, url: 'data:image/png;base64,' + bytes.toString('base64') });
const receipt = () => ({ id: fileId, investigationId: id, name: 'evidencia.png', mime: 'image/png', size: bytes.length, sha256, createdAt: '2026-10-13T18:00:00.000Z' });
afterEach(() => vi.unstubAllGlobals());
describe('Archivos remotos y copia local', () => {
  it('sube bytes intactos y conserva la URL local junto al vínculo remoto', async () => {
    let uploaded: Blob | undefined;
    vi.stubGlobal('fetch', vi.fn(async (path: string, init?: RequestInit) => {
      if (path.startsWith('data:')) return nativeFetch(path);
      if (init?.body instanceof Blob) uploaded = init.body;
      return new Response(JSON.stringify(receipt()));
    }));
    const original = asset(); const assets = await uploadBoardFiles({ ...demoInvestigation(), id, assets: [original] });
    expect(uploaded).toBeDefined(); expect(Buffer.from(await uploaded!.arrayBuffer())).toEqual(bytes);
    expect(assets[0]?.url).toBe(original.url); expect(assets[0]?.remoteFile?.id).toBe(fileId); expect(original.remoteFile).toBeUndefined();
    expect(remoteContent({ ...demoInvestigation(), id, assets }).assets[0]?.file).toEqual({ id: fileId, sha256 });
  });
  it('no vuelve a subir bytes ya confirmados en la misma investigación', async () => {
    const fetch = vi.fn((path: string) => nativeFetch(path)); vi.stubGlobal('fetch', fetch);
    const existing = { ...asset(), remoteFile: { id: fileId, investigationId: id, sha256 } };
    expect((await uploadBoardFiles({ ...demoInvestigation(), id, assets: [existing] }))[0]).toBe(existing);
    expect(fetch).toHaveBeenCalledTimes(1); expect(fetch.mock.calls[0]?.[0]).toMatch(/^data:/);
  });
  it('rechaza confirmaciones que no corresponden a los bytes enviados', async () => {
    vi.stubGlobal('fetch', vi.fn((path: string) => path.startsWith('data:') ? nativeFetch(path) : Promise.resolve(new Response(JSON.stringify({ ...receipt(), sha256: 'a'.repeat(64) })))));
    await expect(uploadBoardFiles({ ...demoInvestigation(), id, assets: [asset()] })).rejects.toThrow('copia íntegra');
  });
  it('verifica tamaño, MIME y hash al recuperar, sin simular una descarga válida', async () => {
    const remote = { ...asset(), url: undefined, remoteFile: { id: fileId, investigationId: id, sha256 } };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(bytes, { headers: { 'Content-Type': 'image/png' } })));
    expect(Buffer.from(await (await downloadRemoteFile(remote)).arrayBuffer())).toEqual(bytes);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(Buffer.alloc(bytes.length), { headers: { 'Content-Type': 'image/png' } })));
    await expect(downloadRemoteFile(remote)).rejects.toThrow('no coincide');
  });
  it('informa un backend caído y no muta el recurso local', async () => {
    const remote = { ...asset(), url: undefined, remoteFile: { id: fileId, investigationId: id, sha256 } };
    expect(assetSource(remote)).toBe(`/api/investigations/${id}/files/${fileId}`);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 503 })));
    await expect(downloadRemoteFile(remote)).rejects.toThrow('backend');
    expect(remote.remoteFile.sha256).toBe(sha256);
  });
  it('las fuentes de ejemplo y Office permanecen como metadatos sin inventar originales', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    const assets = demoInvestigation().assets;
    expect(await uploadBoardFiles({ ...demoInvestigation(), id })).toEqual(assets); expect(fetch).not.toHaveBeenCalled();
  });
});
