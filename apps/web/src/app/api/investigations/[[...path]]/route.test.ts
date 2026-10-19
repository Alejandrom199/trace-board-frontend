import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe('proxy privado hacia Railway', () => {
  it('añade el token solo en el servidor y conserva ruta, consulta y cuerpo', async () => {
    vi.stubEnv('TRACEBOARD_API_URL', 'https://traceboard-api.example');
    vi.stubEnv('TRACEBOARD_API_TOKEN', 't'.repeat(32));
    const fetch = vi.fn().mockResolvedValue(Response.json({ ok: true }, { status: 201 }));
    vi.stubGlobal('fetch', fetch);
    const response = await POST(new Request('https://traceboard.example/api/investigations?id=1', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"name":"Inventario"}' }));
    expect(response.status).toBe(201);
    const [url, init] = fetch.mock.calls[0]!;
    expect(String(url)).toBe('https://traceboard-api.example/api/investigations?id=1');
    expect((init.headers as Headers).get('authorization')).toBe('Bearer ' + 't'.repeat(32));
    expect(new TextDecoder().decode(init.body as ArrayBuffer)).toBe('{"name":"Inventario"}');
  });
  it('devuelve un error controlado cuando Railway no responde', async () => {
    vi.stubEnv('TRACEBOARD_API_URL', 'https://traceboard-api.example');
    vi.stubEnv('TRACEBOARD_API_TOKEN', 't'.repeat(32));
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const response = await GET(new Request('https://traceboard.example/api/investigations'));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ message: expect.stringContaining('copia local') });
  });
});
