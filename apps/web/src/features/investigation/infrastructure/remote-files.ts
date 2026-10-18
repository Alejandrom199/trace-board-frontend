import { fileDtoSchema } from '@traceboard/contracts';
import { assetSchema, type Asset, type Investigation } from '../domain/model';
import { MAX_FILE_BYTES } from '../domain/limits';

export function assetSource(asset?: Asset): string | undefined {
  return asset?.url ?? (asset?.remoteFile ? `/api/investigations/${encodeURIComponent(asset.remoteFile.investigationId)}/files/${encodeURIComponent(asset.remoteFile.id)}` : undefined);
}
async function hash(blob: Blob): Promise<string> {
  const result = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return Array.from(new Uint8Array(result), byte => byte.toString(16).padStart(2, '0')).join('');
}
async function fileRequest(path: string, init?: RequestInit): Promise<Response> {
  let response: Response;
  try { response = await fetch(path, { ...init, cache: 'no-store', signal: AbortSignal.timeout(30000) }); }
  catch { throw new Error('No se pudo conectar para recuperar o subir el archivo. Tu copia local se conserva.'); }
  if (response.ok) return response;
  if (response.status === 404) throw new Error('El archivo o la investigación no están disponibles.');
  if (response.status === 400 || response.status === 415) throw new Error('El archivo no es válido. Usa PDF o imagen con extensión y contenido coincidentes.');
  if (response.status === 413) throw new Error('Cada archivo admite hasta 10 MB. Tu copia local se conserva.');
  throw new Error('No se pudo recuperar o subir el archivo. Comprueba que el backend esté disponible.');
}
export async function downloadRemoteFile(asset: Asset): Promise<Blob> {
  if (!asset.remoteFile) throw new Error('El archivo no tiene una copia remota.');
  const url = `/api/investigations/${encodeURIComponent(asset.remoteFile.investigationId)}/files/${encodeURIComponent(asset.remoteFile.id)}`;
  const response = await fileRequest(url);
  const length = Number(response.headers.get('content-length'));
  if (length > MAX_FILE_BYTES) throw new Error('El archivo remoto supera el tamaño permitido.');
  const blob = await response.blob();
  if (blob.size !== asset.size || blob.size > MAX_FILE_BYTES || blob.type !== asset.mime || await hash(blob) !== asset.remoteFile.sha256) throw new Error('El archivo recuperado no coincide con su evidencia. Vuelve a intentarlo.');
  return blob;
}
export async function uploadBoardFiles(board: Investigation, progress?: (done: number, total: number) => void): Promise<Asset[]> {
  const assets: Asset[] = [];
  const candidates = board.assets.filter(asset => asset.url?.startsWith('data:') || asset.remoteFile);
  let done = 0;
  for (const asset of board.assets) {
    if (!asset.url?.startsWith('data:') && !asset.remoteFile) { assets.push(asset); continue; }
    if (!asset.url?.startsWith('data:') && asset.remoteFile?.investigationId === board.id) {
      assets.push(asset); progress?.(++done, candidates.length); continue;
    }
    const blob = asset.url?.startsWith('data:') ? await (await fetch(asset.url)).blob() : await downloadRemoteFile(asset);
    if (blob.size !== asset.size || blob.type !== asset.mime || !blob.size || blob.size > MAX_FILE_BYTES) throw new Error(`No se pudo validar ${asset.name}. Tu copia local se conserva.`);
    const sha256 = await hash(blob);
    if (asset.remoteFile?.investigationId === board.id && asset.remoteFile.sha256 === sha256) {
      assets.push(asset); progress?.(++done, candidates.length); continue;
    }
    const response = await fileRequest(`/api/investigations/${encodeURIComponent(board.id)}/files`, { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', 'X-File-Name': encodeURIComponent(asset.name), 'X-File-Mime': asset.mime }, body: blob });
    let data: unknown;
    try { data = await response.json(); } catch { throw new Error('La API devolvió una respuesta de archivo inválida.'); }
    const parsed = fileDtoSchema.safeParse(data);
    if (!parsed.success || parsed.data.investigationId !== board.id || parsed.data.name !== asset.name || parsed.data.mime !== asset.mime || parsed.data.size !== asset.size || parsed.data.sha256 !== sha256) throw new Error('La API no confirmó una copia íntegra del archivo. Tu copia local se conserva.');
    assets.push(assetSchema.parse({ ...asset, remoteFile: { id: parsed.data.id, investigationId: parsed.data.investigationId, sha256 } }));
    progress?.(++done, candidates.length);
  }
  return assets;
}
