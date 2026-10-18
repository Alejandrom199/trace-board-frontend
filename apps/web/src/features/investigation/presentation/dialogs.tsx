'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X, FileText, ArrowDownToLine } from 'lucide-react';
import type { Asset, Entity } from '../domain/model';
import { downloadRemoteFile } from '../infrastructure/remote-files';

export function Dialog({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog className={`dialog ${wide ? 'wide' : ''}`} ref={ref} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose(); } }}>
    <div className="dialog-heading"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Cerrar diálogo"><X size={18} /></button></div>{children}
  </dialog>;
}
export function PreviewDialog({ entity, asset, onClose }: { entity: Entity; asset?: Asset; onClose: () => void }) {
  const [remote, setRemote] = useState<{ asset: Asset; url?: string; error?: string } | null>(null);
  const [failedImage, setFailedImage] = useState('');
  useEffect(() => {
    if (!asset?.remoteFile || asset.url) return;
    let active = true; let objectUrl: string | undefined;
    void downloadRemoteFile(asset).then(blob => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob); setRemote({ asset, url: objectUrl });
    }).catch(error => { if (active) setRemote({ asset, error: error instanceof Error ? error.message : 'No se pudo recuperar el archivo.' }); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [asset]);
  const result = remote?.asset === asset ? remote : null;
  const url = asset?.url ?? result?.url;
  const error = result?.error ?? (url && failedImage === url ? 'El navegador no pudo mostrar esta imagen. Puedes descargar el original.' : undefined);
  const loading = asset?.remoteFile && !url && !error;
  return <Dialog title={entity.title} onClose={onClose} wide><div className="preview-body">
    {loading ? <div className="document-preview" role="status">Recuperando archivo del backend…</div> : error ? <div className="document-preview" role="alert">{error}<p>Tu investigación se conserva. Cierra y vuelve a abrir para reintentar.</p></div> : url && asset?.mime.startsWith('image/') ? <div className="image-preview">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={entity.title} onError={() => setFailedImage(url)} />
    </div> : url && asset?.mime === 'application/pdf' ? <><iframe className="pdf-preview" src={url} title={`PDF: ${asset.name}`} sandbox="" /><p className="preview-notice">Si tu navegador no muestra el PDF, descarga el original.</p></> : <div className="document-preview"><FileText size={34} /><span className="demo-label">{asset?.id.endsWith('-file') ? 'Fuente de demostración · el archivo original no está adjunto' : 'Vista de metadatos · sin contenido del archivo'}</span><h3>{asset?.name ?? entity.title}</h3><p>{entity.description || 'Añade una descripción desde el inspector.'}</p><div className="preview-notice">{asset?.name.match(/\.(xlsx?|docx?)$/i) ? 'Word y Excel se representan por sus metadatos en esta etapa. La visualización y el almacenamiento del archivo completo se incorporarán después.' : 'Puedes adjuntar un PDF o una imagen real de hasta 10 MB desde el panel de recursos.'}</div></div>}
    <div className="preview-footer"><span>{asset?.name ?? 'Sin archivo adjunto'} {asset ? `· ${Math.round(asset.size / 1000)} KB` : ''} {asset?.remoteFile ? '· Original en backend' : ''}</span>{url && asset && /^(data:|blob:)/.test(url) && <a className="secondary-button" download={asset.name} href={url}><ArrowDownToLine size={14} />Descargar archivo</a>}</div>
  </div></Dialog>;
}
