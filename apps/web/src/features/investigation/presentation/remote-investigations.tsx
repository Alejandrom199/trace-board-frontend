'use client';
import { useCallback, useEffect, useState } from 'react';
import { Database, FolderOpen, Plus, RefreshCw } from 'lucide-react';
import type { InvestigationDto, BoardDto } from '@traceboard/contracts';
import { createRemoteInvestigation, listRemoteInvestigations, openRemoteBoard } from '../infrastructure/investigations-api';

export function RemoteInvestigations({ onOpen }: { onOpen: (investigation: BoardDto) => Promise<void> }) {
  const [items, setItems] = useState<InvestigationDto[]>([]);
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(''); const [name, setName] = useState(''); const [description, setDescription] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try { setItems(await listRemoteInvestigations()); }
    catch (error) { setError(error instanceof Error ? error.message : 'No se pudo consultar la base de datos'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    let active = true;
    void listRemoteInvestigations().then(items => { if (active) setItems(items); })
      .catch(error => { if (active) setError(error instanceof Error ? error.message : 'No se pudo consultar la base de datos'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const open = async (id: string) => {
    setBusy(true); setError('');
    try { await onOpen(await openRemoteBoard(id)); }
    catch (error) { setError(error instanceof Error ? error.message : 'No se pudo abrir la investigación'); }
    finally { setBusy(false); }
  };
  return <section className="remote-investigations" aria-label="Investigaciones en base de datos">
    <div className="remote-heading"><h3><Database size={16} />Base de datos</h3><button className="icon-button" onClick={() => void refresh()} disabled={loading || busy} aria-label="Actualizar investigaciones remotas"><RefreshCw size={15} /></button></div>
    <p className="muted">Abre tu tablero desde PostgreSQL. «Guardar en base de datos» guarda tarjetas, relaciones y los PDF e imágenes adjuntos. Word/Excel siguen como metadatos.</p>
    {error && <p className="remote-error" role="alert">{error}</p>}
    {loading ? <p className="muted" role="status">Consultando investigaciones…</p> : items.length ? items.map(item => <button className="project-row" key={item.id} disabled={busy} onClick={() => void open(item.id)}><FolderOpen size={20} /><span><strong>{item.name}</strong><small>{item.description || 'Investigación guardada en PostgreSQL'}</small></span></button>) : !error && <p className="muted">Todavía no hay investigaciones en la base de datos.</p>}
    <form onSubmit={async event => {
      event.preventDefault(); setBusy(true); setError('');
      try { const created = await createRemoteInvestigation({ name, description }); await onOpen(await openRemoteBoard(created.id)); }
      catch (error) { setError(error instanceof Error ? error.message : 'No se pudo guardar la investigación'); }
      finally { setBusy(false); }
    }}>
      <label>Nombre en la base de datos<input aria-label="Nombre en la base de datos" maxLength={120} required value={name} onChange={event => setName(event.target.value)} placeholder="Ej. Investigación de compras" /></label>
      <label>Descripción en la base de datos<textarea aria-label="Descripción en la base de datos" maxLength={2000} rows={2} value={description} onChange={event => setDescription(event.target.value)} /></label>
      <button className="primary-button" disabled={busy || loading || !name.trim()} type="submit"><Plus size={15} />{busy ? 'Guardando…' : 'Crear en base de datos'}</button>
    </form>
  </section>;
}
