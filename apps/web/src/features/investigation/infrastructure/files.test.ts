import { describe, it, expect } from 'vitest';
import { readAsset } from './files';
import { MAX_FILE_BYTES } from '../domain/limits';
describe('Validación de archivos antes de incorporarlos', () => {
  it('rechaza tipos activos y archivos de más de 10 MB', async () => {
    await expect(readAsset(new File(['<script>'], 'evidence.html'), 'asset')).rejects.toThrow('Usa una imagen');
    await expect(readAsset(new File([new Uint8Array(MAX_FILE_BYTES + 1)], 'large.png'), 'asset')).rejects.toThrow('hasta 10 MB');
  });
  it('rechaza un archivo que simula ser una imagen o documento', async () => {
    await expect(readAsset(new File(['<svg onload="alert(1)">'], 'attack.png', { type: 'image/png' }), 'asset')).rejects.toThrow('no coincide');
    await expect(readAsset(new File(['not a pdf'], 'report.pdf', { type: 'application/pdf' }), 'asset')).rejects.toThrow('no coincide');
  });
  it('conserva solo metadatos de Office en esta etapa', async () => {
    const asset = await readAsset(new File([new Uint8Array([80, 75, 3, 4])], 'inventory.xlsx'), 'sheet');
    expect(asset.name).toBe('inventory.xlsx'); expect(asset.url).toBeUndefined(); expect(asset.size).toBe(4);
  });
  it('acepta exactamente 10 MB sin perder el tamaño del archivo', async () => {
    const bytes = new Uint8Array(MAX_FILE_BYTES); bytes.set([80, 75, 3, 4]);
    const asset = await readAsset(new File([bytes], 'inventory.xlsx'), 'sheet');
    expect(asset.size).toBe(MAX_FILE_BYTES);
  });
});
