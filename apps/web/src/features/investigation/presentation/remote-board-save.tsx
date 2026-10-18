'use client';
import { useEffect, useRef, useState } from 'react';
import { Database } from 'lucide-react';
import type { BoardDto } from '@traceboard/contracts';
import type { Investigation } from '../domain/model';
import { contentFingerprint, remoteContent, saveRemoteBoard } from '../infrastructure/investigations-api';
import { uploadBoardFiles } from '../infrastructure/remote-files';

export function RemoteBoardSave({ board, onSaved }: { board: Investigation; onSaved: (id: string, dto: BoardDto, fingerprint: string, source: Investigation) => void }) {
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [status, setStatus] = useState<{ source: Investigation; dirty: boolean } | null>(null);
  useEffect(() => {
    let active = true;
    if (board.remote) void Promise.resolve().then(() => contentFingerprint(remoteContent(board))).then(fingerprint => {
      if (active) setStatus({ source: board, dirty: fingerprint !== board.remote?.fingerprint });
    }).catch(() => { if (active) setError('El tablero contiene datos que no se pueden guardar. Tu copia local se conserva.'); });
    return () => { active = false; };
  }, [board]);
  if (!board.remote) return null;
  const save = async () => {
    if (inFlight.current || !board.remote) return;
    inFlight.current = true; setBusy(true); setError(''); setProgress('Preparando archivos…');
    try {
      const assets = await uploadBoardFiles(board, (done, total) => setProgress(`Archivos confirmados: ${done}/${total}`));
      const content = remoteContent({ ...board, assets });
      const fingerprint = await contentFingerprint(content);
      setProgress('Guardando tablero…');
      const result = await saveRemoteBoard(board.id, board.remote.revision, content);
      onSaved(board.id, result, fingerprint, board);
    } catch (error) { setError(error instanceof Error ? error.message : 'No se pudo guardar. Tu copia local se conserva.'); }
    finally { inFlight.current = false; setBusy(false); }
  };
  const dirty = status?.source !== board || status.dirty;
  return <div className="remote-board-bar" aria-label="Guardado del tablero en base de datos">
    <span role="status">{busy ? progress : `Versión ${board.remote.revision} en PostgreSQL · ${dirty ? 'cambios locales pendientes' : 'tablero guardado'}`}<small>PDF e imágenes se suben al guardar. Word/Excel y ejemplos conservan metadatos. El autoguardado local continúa.</small></span>
    <button className="secondary-button" onClick={() => void save()} disabled={busy}><Database size={15} />Guardar en base de datos</button>
    {error && <p className="remote-error" role="alert">{error}</p>}
  </div>;
}
