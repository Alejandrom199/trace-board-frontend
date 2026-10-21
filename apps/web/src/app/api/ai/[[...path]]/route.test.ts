import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe('proxy privado hacia la generación de flujo con IA', () => {
  it('reenvía el documento con el token solo en el servidor', async () => {
    vi.stubEnv('TRACEBOARD_API_URL', 'https://traceboard-api.example');
    vi.stubEnv('TRACEBOARD_API_TOKEN', 't'.repeat(32));
    const fetch = vi.fn().mockResolvedValue(Response.json({ flow: { entities: [], relations: [] }, truncated: false }, { status: 201 }));
    vi.stubGlobal('fetch', fetch);
    const response = await POST(new Request('https://traceboard.example/api/ai/generate-flow', {
      method: 'POST', headers: { 'Content-Type': 'application/octet-stream', 'X-File-Name': 'acta.txt', 'X-File-Mime': 'text/plain' }, body: new Uint8Array([1, 2, 3]),
    }));
    expect(response.status).toBe(201);
    const [url, init] = fetch.mock.calls[0]!;
    expect(String(url)).toBe('https://traceboard-api.example/api/ai/generate-flow');
    expect((init.headers as Headers).get('authorization')).toBe('Bearer ' + 't'.repeat(32));
    expect((init.headers as Headers).get('x-file-mime')).toBe('text/plain');
  });
  it('devuelve un error controlado cuando el backend no responde', async () => {
    vi.stubEnv('TRACEBOARD_API_URL', 'https://traceboard-api.example');
    vi.stubEnv('TRACEBOARD_API_TOKEN', 't'.repeat(32));
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const response = await POST(new Request('https://traceboard.example/api/ai/generate-flow', { method: 'POST', body: new Uint8Array([1]) }));
    expect(response.status).toBe(503);
  });
});
