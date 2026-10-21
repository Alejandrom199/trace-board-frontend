import { aiGenerateFlowResponseSchema, type AiGenerateFlowResponse } from '@traceboard/contracts';

export const MAX_AI_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const AI_DOCUMENT_ACCEPT = '.pdf,.txt,.md';

/** Sube un documento (PDF con texto, .txt o .md) para que la IA proponga un flujo. No persiste nada: la revisión y el alta ocurren en el cliente. */
export async function generateFlowFromDocument(file: File): Promise<AiGenerateFlowResponse> {
  if (file.size > MAX_AI_DOCUMENT_BYTES) throw new Error('El documento admite hasta 10 MB para generar un flujo con IA.');
  let response: Response;
  try {
    response = await fetch('/api/ai/generate-flow', {
      method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(90000),
      headers: { 'Content-Type': 'application/octet-stream', 'X-File-Name': encodeURIComponent(file.name), 'X-File-Mime': file.type },
      body: file,
    });
  } catch { throw new Error('No se pudo conectar con el servicio de IA. Tu tablero no cambió.'); }
  if (!response.ok) {
    if (response.status === 400 || response.status === 415) throw new Error('Usa un PDF con texto, o un archivo .txt/.md, con extensión y tipo coincidentes.');
    if (response.status === 503) throw new Error('La generación con IA no está configurada en este servidor.');
    if (response.status === 502) throw new Error('La IA no pudo generar un flujo a partir de este documento. Inténtalo de nuevo o con otro archivo.');
    throw new Error('No se pudo generar el flujo. Comprueba que el backend esté disponible.');
  }
  const data = await response.json().catch(() => undefined);
  const parsed = aiGenerateFlowResponseSchema.safeParse(data);
  if (!parsed.success) throw new Error('La IA devolvió una respuesta con un formato inesperado.');
  return parsed.data;
}
