import { assetSchema, type Asset } from '../domain/model';
import { MAX_FILE_BYTES, MAX_FILE_MB } from '../domain/limits';

const accepted = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'pdf', 'xlsx', 'xls', 'doc', 'docx'];
export async function readAsset(file: File, id: string): Promise<Asset> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!accepted.includes(extension)) throw new Error('Usa una imagen PNG/JPG/WebP/GIF, PDF, Word o Excel.');
  if (file.size > MAX_FILE_BYTES) throw new Error(`Cada archivo admite hasta ${MAX_FILE_MB} MB en este prototipo.`);
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const prefix = Array.from(bytes.slice(0, 4));
  const signatures: Record<string, boolean> = {
    png: prefix.join(',') === '137,80,78,71', jpg: prefix[0] === 255 && prefix[1] === 216, jpeg: prefix[0] === 255 && prefix[1] === 216,
    pdf: prefix.join(',') === '37,80,68,70', gif: prefix.join(',') === '71,73,70,56',
    webp: prefix.join(',') === '82,73,70,70' && Array.from(bytes.slice(8, 12)).join(',') === '87,69,66,80',
    xlsx: prefix[0] === 80 && prefix[1] === 75, docx: prefix[0] === 80 && prefix[1] === 75,
    xls: prefix.join(',') === '208,207,17,224', doc: prefix.join(',') === '208,207,17,224',
  };
  if (!signatures[extension]) throw new Error('El contenido del archivo no coincide con su extensión.');
  const mimeMap: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', pdf: 'application/pdf' };
  const mime = mimeMap[extension] ?? 'application/octet-stream';
  let url: string | undefined;
  if (mime !== 'application/octet-stream') {
    url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result.replace(/^data:[^;]*;/, `data:${mime};`)) : reject(new Error('Archivo ilegible'));
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
      reader.readAsDataURL(file);
    });
  }
  return assetSchema.parse({ id, name: file.name, size: file.size, mime, ...(url ? { url } : {}) });
}
