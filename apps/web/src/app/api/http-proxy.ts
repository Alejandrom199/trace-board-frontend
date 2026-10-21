const RESPONSE_HEADERS = ['content-type', 'content-disposition', 'content-length', 'cache-control', 'x-content-type-options', 'content-security-policy'];
function configuration(): { baseUrl: URL; token?: string } {
  const raw = process.env.TRACEBOARD_API_URL ?? 'http://127.0.0.1:4000';
  const baseUrl = new URL(raw);
  if (!['http:', 'https:'].includes(baseUrl.protocol) || baseUrl.username || baseUrl.password) throw new Error('TRACEBOARD_API_URL no es válida');
  const token = process.env.TRACEBOARD_API_TOKEN;
  if (process.env.NODE_ENV === 'production' && (!token || token.length < 32)) throw new Error('TRACEBOARD_API_TOKEN no está configurado');
  return { baseUrl, token };
}
/** Proxy privado hacia la API de Railway: reenvía ruta, consulta y cuerpo, añadiendo el token solo en el servidor.
 * Genérico para cualquier ruta bajo /api/* que lo use: la ruta de destino se deriva del propio request, no de este módulo. */
export async function proxyRequest(request: Request): Promise<Response> {
  try {
    const { baseUrl, token } = configuration();
    const incoming = new URL(request.url);
    const destination = new URL(incoming.pathname + incoming.search, baseUrl);
    const headers = new Headers();
    for (const name of ['content-type', 'x-file-name', 'x-file-mime']) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    if (token) headers.set('authorization', 'Bearer ' + token);
    const upstream = await fetch(destination, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD', 'DELETE'].includes(request.method) ? undefined : await request.arrayBuffer(),
      cache: 'no-store',
      signal: AbortSignal.timeout(90000),
    });
    const responseHeaders = new Headers();
    for (const name of RESPONSE_HEADERS) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return Response.json({ statusCode: 503, message: 'El servicio remoto no está disponible. Tu copia local se conserva.' }, { status: 503 });
  }
}
