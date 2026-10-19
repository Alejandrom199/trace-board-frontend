'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactFlowProvider, type ReactFlowInstance, type Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Network, ChevronDown, ChevronRight, Plus, Search, PanelLeftClose, PanelLeftOpen, ArrowDownToLine, Upload, MousePointer2, Hand, Link2, Minus, Maximize, Map, Command, X, Check, FolderOpen, ListChecks, CircleHelp, ArrowUpRight, AlertTriangle, LayoutGrid, CheckCircle2, Clock3, Undo2, Redo2, Trash2 } from 'lucide-react';
import { cardGroups, cardLabels, entityCode, relationTypes, relationLabels, type CardType, type Investigation, type RelationType, type Workspace } from '../domain/model';
import { demoWorkspace } from '../domain/demo';
import { addCard, removeInvestigation, connectCards, createInvestigation, removeCards, updateCard, updateRelation } from '../application/actions';
import { decodeWorkspace, MAX_WORKSPACE_LENGTH } from '../infrastructure/local-storage';
import { loadBrowserWorkspace, saveBrowserWorkspace } from '../infrastructure/indexed-db';
import { readAsset } from '../infrastructure/files';
import { BoardCanvas, fromCanvasId } from './board-canvas';
import { Inspector } from './inspector';
import { cardIcons, type CanvasNode } from './card-node';
import { RequirementGroup } from './requirement-group';
import type { CanvasEdge } from './semantic-edge';
import { Dialog, PreviewDialog } from './dialogs';
import { useBoardHistory } from './use-board-history';
import { RemoteInvestigations } from './remote-investigations';
import { RemoteBoardSave } from './remote-board-save';
import { projectRemoteBoard } from '../infrastructure/investigations-api';
import type { BoardDto } from '@traceboard/contracts';
import './remote-investigations.css';

type Modal = 'projects' | 'relation' | 'search' | 'help' | null;
const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();

export function InvestigationApp() { return <ReactFlowProvider><InvestigationWorkspace /></ReactFlowProvider>; }

function InvestigationWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [edgeId, setEdgeId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'pending' | 'error'>('pending');
  const [saveBlocked, setSaveBlocked] = useState(false);
  const [error, setError] = useState('');
  const [sidebar, setSidebar] = useState(true);
  const [pan, setPan] = useState(false);
  const [minimap, setMinimap] = useState(false);
  const [view, setView] = useState<'board' | 'requirements'>('board');
  const [modal, setModal] = useState<Modal>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [relationSource, setRelationSource] = useState('');
  const [relationTarget, setRelationTarget] = useState('');
  const [relationType, setRelationType] = useState<RelationType>('evidences');
  const [zoom, setZoom] = useState(1);
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const flowRef = useRef<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const latestRef = useRef<Workspace | null>(null);
  const dragSnapshot = useRef<Investigation | null>(null);
  const { histories, record, step, reset } = useBoardHistory();
  const [historyStep, setHistoryStep] = useState(0);
  const board = workspace?.investigations.find(item => item.id === workspace.activeId);

  useEffect(() => {
    let mounted = true;
    Promise.resolve().then(async () => {
      if (!mounted) return;
      try {
        const result = await loadBrowserWorkspace();
        if (!mounted) return;
        if (result.status === 'error') { setSaveBlocked(true); setError(result.message); setSaveStatus('error'); }
        setWorkspace(result.status === 'loaded' ? result.workspace : demoWorkspace());
      } catch {
        if (!mounted) return;
        setSaveBlocked(true); setSaveStatus('error'); setError('El navegador no permite almacenamiento local. Exporta tu sesión para conservarla.'); setWorkspace(demoWorkspace());
      }
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    latestRef.current = workspace;
    if (!workspace || saveBlocked) return;
    let active = true;
    const timeout = window.setTimeout(async () => {
      try { await saveBrowserWorkspace(workspace); if (active && latestRef.current === workspace) setSaveStatus('saved'); }
      catch (reason) { if (active) { setSaveStatus('error'); setError(reason instanceof Error ? reason.message : 'No se pudo guardar'); } }
    }, 600);
    const flush = () => { if (latestRef.current) void saveBrowserWorkspace(latestRef.current).catch(() => { /* Browser shutdown cannot guarantee completion; the visible save status is authoritative. */ }); };
    const flushWhenHidden = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', flushWhenHidden);
    return () => { active = false; clearTimeout(timeout); window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', flushWhenHidden); };
  }, [workspace, saveBlocked]);

  useEffect(() => { if (!toast) return; const timeout = setTimeout(() => setToast(''), 3000); return () => clearTimeout(timeout); }, [toast]);

  const mutate = useCallback((change: (board: Investigation) => Investigation, label: string | null = 'Modificar tarjeta'): boolean => {
    const current = latestRef.current;
    const active = current?.investigations.find(item => item.id === current.activeId);
    if (!active || !current) return false;
    try {
      const next = change(active);
      if (next === active) return true;
      if (label) record(active, next, label);
      const updated = { ...current, investigations: current.investigations.map(item => item.id === active.id ? next : item) };
      latestRef.current = updated;
      setWorkspace(updated);
      setSaveStatus(saveBlocked ? 'error' : 'pending');
      return true;
    } catch (reason) { setError(reason instanceof Error ? reason.message.includes('"code"') ? 'El cambio no es válido. Revisa los campos y evita relaciones duplicadas.' : reason.message : 'No se pudo aplicar el cambio'); return false; }
  }, [saveBlocked, record]);

  const moveCards = useCallback((changes: { id: string; x: number; y: number; dragging?: boolean }[]) => {
    const current = latestRef.current;
    const active = current?.investigations.find(item => item.id === current.activeId);
    if (!active) return;
    const dragging = changes.some(change => change.dragging === true);
    if (dragging && !dragSnapshot.current) dragSnapshot.current = active;
    mutate(board => {
      const elements = board.elements.map(element => {
        const change = changes.find(item => item.id === element.nodeId);
        return change && (change.x !== element.x || change.y !== element.y) ? { nodeId: element.nodeId, x: change.x, y: change.y } : element;
      });
      return elements.some((element, index) => element !== board.elements[index]) ? { ...board, updatedAt: now(), elements } : board;
    }, dragging || dragSnapshot.current ? null : 'Mover tarjetas');
    if (changes.some(change => change.dragging === false) && dragSnapshot.current) {
      const after = latestRef.current?.investigations.find(item => item.id === active.id);
      if (after) record(dragSnapshot.current, after, 'Mover tarjetas');
      dragSnapshot.current = null;
    }
  }, [mutate, record]);

  const applyHistory = useCallback((direction: 'undo' | 'redo') => {
    // A gesture is committed as one action after the drag finishes.
    if (dragSnapshot.current) return;
    const current = latestRef.current;
    const active = current?.investigations.find(item => item.id === current.activeId);
    if (!current || !active) return;
    const result = step(active, direction, now());
    if (!result) return;
    const next = { ...current, investigations: current.investigations.map(item => item.id === active.id ? result.board : item) };
    latestRef.current = next; setWorkspace(next); setSaveStatus(saveBlocked ? 'error' : 'pending');
    setSelected(previous => previous.filter(id => result.board.entities.some(entity => entity.id === id)));
    setEdgeId(previous => result.board.edges.some(edge => edge.id === previous) ? previous : null);
    setPreviewId(null); setHistoryStep(value => value + 1);
    setToast(`${direction === 'undo' ? 'Deshecho' : 'Rehecho'}: ${result.label}`);
  }, [step, saveBlocked]);

  const select = useCallback((ids: string[]) => setSelected(previous => previous.join('|') === ids.join('|') ? previous : ids), []);
  const closeInspector = useCallback(() => { select([]); setEdgeId(null); }, [select]);
  const showPreview = useCallback((id: string) => setPreviewId(id), []);
  const focusEntity = useCallback((id: string) => {
    setView('board'); select([id]); setEdgeId(null); setModal(null);
    const element = board?.elements.find(item => item.nodeId === id);
    if (element) window.setTimeout(() => { void flowRef.current?.setCenter(element.x + 155, element.y + 130, { zoom: 0.95, duration: 400 }); }, 80);
  }, [board, select]);
  const deleteCards = useCallback((ids: string[]) => {
    mutate(board => removeCards(board, ids, now()), 'Eliminar tarjetas'); select([]); setEdgeId(null); setToast(`${ids.length === 1 ? 'Tarjeta eliminada' : 'Tarjetas eliminadas'}. Puedes deshacer esta acción.`);
  }, [mutate, select]);
  const deleteEdges = useCallback((ids: string[]) => { mutate(board => ({ ...board, updatedAt: now(), edges: board.edges.filter(edge => !ids.includes(edge.id)) }), 'Eliminar relaciones'); setEdgeId(null); }, [mutate]);
  const createCard = useCallback((kind: CardType, point?: { x: number; y: number }) => {
    const bounds = canvasRef.current?.getBoundingClientRect();
    const position = flowRef.current?.screenToFlowPosition(point ?? { x: (bounds?.left ?? 300) + (bounds?.width ?? 600) / 2 - 120, y: (bounds?.top ?? 120) + (bounds?.height ?? 500) / 2 - 80 }) ?? { x: 400, y: 200 };
    const id = uid(); if (mutate(board => addCard(board, kind, id, now(), position), 'Crear tarjeta')) { select([id]); setEdgeId(null); setView('board'); }
  }, [mutate, select]);
  const openRelation = useCallback(() => { setRelationSource(selected[0] ?? board?.entities[0]?.id ?? ''); setRelationTarget(selected[1] ?? board?.entities.find(entity => entity.id !== selected[0])?.id ?? ''); setRelationType('evidences'); setModal('relation'); }, [board, selected]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target;
      const typing = target instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearch(''); setModal('search'); return; }
      if (typing || modal || previewId) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.altKey) {
        event.preventDefault(); applyHistory(event.shiftKey ? 'redo' : 'undo'); return;
      }
      if (event.ctrlKey && event.key.toLowerCase() === 'y' && !event.altKey) { event.preventDefault(); applyHistory('redo'); return; }
      if (event.key === 'Escape') { closeInspector(); return; }
      if ((event.key === 'Delete' || event.key === 'Backspace') && (selected.length || edgeId)) { event.preventDefault(); if (selected.length) deleteCards(selected); else if (edgeId) deleteEdges([edgeId]); }
      if (event.key.toLowerCase() === 'n' && !event.ctrlKey && !event.metaKey) createCard('note');
      if (event.key.toLowerCase() === 'v') setPan(false);
      if (event.key.toLowerCase() === 'h') setPan(true);
      if (event.key.toLowerCase() === 'f') void flowRef.current?.fitView({ padding: 0.15, duration: 400 });
    };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  }, [selected, edgeId, modal, previewId, closeInspector, deleteCards, deleteEdges, createCard, applyHistory]);

  const attachFiles = useCallback(async (files: File[], point?: { x: number; y: number }) => {
    if (!board) return;
    if (files.length > 8) { setError('Adjunta hasta 8 archivos por vez.'); return; }
    setBusy(true);
    try {
      const assets = await Promise.all(files.map(file => readAsset(file, uid())));
      const bounds = canvasRef.current?.getBoundingClientRect();
      const position = flowRef.current?.screenToFlowPosition(point ?? { x: (bounds?.left ?? 200) + 150, y: (bounds?.top ?? 100) + 150 }) ?? { x: 200, y: 200 };
      const cards = assets.map((asset, index) => ({ asset, id: uid(), position: { x: position.x + index * 45, y: position.y + index * 45 } }));
      const success = mutate(current => {
        let next = current;
        for (const item of cards) {
          next = addCard(next, item.asset.mime.startsWith('image/') ? 'image' : 'document', item.id, now(), item.position);
          const entity = next.entities.find(entity => entity.id === item.id);
          if (entity) next = { ...next, assets: [...next.assets, item.asset], entities: next.entities.map(card => card.id === item.id ? { ...entity, title: item.asset.name, assetId: item.asset.id, description: '' } : card) };
        }
        // Validate the same size and model constraints used by actual persistence before changing the session.
        decodeWorkspace(JSON.stringify({ version: 1, activeId: next.id, investigations: [next] }));
        return next;
      }, 'Añadir recursos');
      if (success) { select(cards.map(card => card.id)); setToast('Recursos incorporados al tablero'); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudieron leer los archivos'); }
    finally { setBusy(false); if (inputRef.current) inputRef.current.value = ''; }
  }, [board, mutate, select]);

  const openDatabaseInvestigation = async (remote: BoardDto) => {
    const current = latestRef.current;
    if (!current) return;
    const id = remote.investigation.id;
    const existing = current.investigations.find(item => item.id === id);
    const projected = await projectRemoteBoard(remote, existing, uid());
    if (latestRef.current !== current) throw new Error('El tablero local cambió mientras se abría. Vuelve a intentarlo; tus cambios se conservaron.');
    const investigations = existing ? current.investigations.map(item => item.id === id ? projected.board : item) : [...current.investigations, projected.board];
    if (projected.draft) investigations.push(projected.draft);
    try {
      const next = decodeWorkspace(JSON.stringify({ ...current, activeId: id, investigations }));
      if (projected.draft && saveBlocked) throw new Error('No se puede proteger el borrador');
      // Confirm the preserved draft locally before replacing the visible board.
      if (projected.draft) await saveBrowserWorkspace(next);
      if (latestRef.current !== current) throw new Error('El tablero cambió durante la apertura');
      reset(id);
      latestRef.current = next; setWorkspace(next); closeInspector(); setModal(null); setView('board'); setSaveStatus(saveBlocked ? 'error' : 'pending');
      setToast(projected.draft ? 'Versión remota abierta. Tu borrador se conservó como copia local.' : 'Investigación abierta desde PostgreSQL');
    } catch { throw new Error('No se pudo abrir el tablero conservando tu copia local. Exporta tus investigaciones actuales y vuelve a intentarlo.'); }
  };
  const acknowledgeRemoteSave = (id: string, dto: BoardDto, fingerprint: string, source: Investigation) => {
    const current = latestRef.current;
    if (!current) return;
    const next = { ...current, investigations: current.investigations.map(item => {
      if (item.id !== id || item.remote?.revision !== source.remote?.revision) return item;
      const assets = item.assets.map(asset => {
        const saved = dto.content?.assets.find(candidate => candidate.id === asset.id);
        const original = source.assets.find(candidate => candidate.id === asset.id);
        return saved?.file && asset === original ? { ...asset, remoteFile: { ...saved.file, investigationId: id } } : asset;
      });
      return { ...item, assets, remote: { revision: dto.revision, fingerprint } };
    }) };
    latestRef.current = next; setWorkspace(next); setSaveStatus(saveBlocked ? 'error' : 'pending');
  };

  const exportBoard = () => {
    if (!workspace) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(workspace, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'traceboard-investigaciones.json'; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); setToast('Copia de investigaciones exportada');
  };
  const importBoard = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > MAX_WORKSPACE_LENGTH) throw new Error('La copia supera el límite de 128 MB.');
      const imported = decodeWorkspace(await file.text());
      if (!workspace) return;
      // Preserve current investigations by assigning fresh IDs only to imported investigation containers.
      const additions = imported.investigations.map(item => ({ ...item, remote: undefined, id: uid(), name: `${item.name} (copia)` .slice(0, 120) }));
      const next: Workspace = { ...workspace, activeId: additions[0]?.id ?? workspace.activeId, investigations: [...workspace.investigations, ...additions] };
      const validated = decodeWorkspace(JSON.stringify(next));
      await saveBrowserWorkspace(validated);
      setWorkspace(validated); setSaveBlocked(false); setSaveStatus('saved'); setError(''); closeInspector(); setModal(null); setToast('Copia importada como investigaciones nuevas');
    } catch (reason) { setError(reason instanceof Error && !reason.message.includes('"code"') ? reason.message : 'La copia no es válida. Tus investigaciones se conservaron.'); }
    finally { if (importRef.current) importRef.current.value = ''; }
  };

  if (!board || !workspace) return <div className="loading-screen"><Network size={38} /><h1>TraceBoard</h1><p>Preparando tu espacio de investigación…</p></div>;
  const entity = board.entities.find(item => item.id === selected[0]);
  const edge = board.edges.find(item => item.id === edgeId);
  const previewEntity = board.entities.find(item => item.id === previewId);
  const query = search.toLocaleLowerCase();
  const matches = board.entities.filter(entity => `${entity.title} ${entity.description} ${entityCode(entity) ?? ''}`.toLocaleLowerCase().includes(query));
  const requirements = board.entities.filter(entity => entity.kind === 'requirement');
  const findings = board.entities.filter(entity => entity.kind === 'finding');
  const requirementGroups = [{ title: 'Requisitos funcionales', items: requirements.filter(item => item.requirement?.type !== 'non_functional') }, { title: 'Requisitos no funcionales', items: requirements.filter(item => item.requirement?.type === 'non_functional') }];
  const files = board.entities.filter(entity => entity.kind === 'document' || entity.kind === 'image');
  const history = histories[board.id];
  const deleteLocal = (id: string) => {
    try {
      const next = removeInvestigation(workspace, id);
      reset(id); latestRef.current = next; setWorkspace(next); setConfirmDelete(null); closeInspector(); setView('board'); setSaveStatus('pending');
      setToast('Investigación eliminada de este navegador');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo eliminar la investigación.'); }
  };
  const changeActive = (id: string) => { setWorkspace({ ...workspace, activeId: id }); closeInspector(); setModal(null); setView('board'); setSaveStatus('pending'); };
  const onConnect = (connection: Connection) => {
    mutate(current => connectCards(current, fromCanvasId(connection.source), fromCanvasId(connection.target), 'evidences', uid(), now()), 'Crear relación');
  };

  return <div className="app-shell">
    <nav className="app-rail" aria-label="Navegación principal"><button className="brand-mark" title="TraceBoard · investigaciones" onClick={() => setModal('projects')} aria-label="Abrir investigaciones"><Network size={27} /></button><div className="rail-divider" /><button className={`rail-button ${view === 'board' ? 'active' : ''}`} aria-label="Ver tablero" title="Tablero" onClick={() => setView('board')}><LayoutGrid size={20} /></button><button className={`rail-button ${view === 'requirements' ? 'active' : ''}`} aria-label="Ver requisitos" title="Requisitos" onClick={() => setView('requirements')}><ListChecks size={20} /></button><button className="rail-button" aria-label="Buscar tarjetas" title="Buscar · Ctrl+K" onClick={() => { setSearch(''); setModal('search'); }}><Search size={20} /></button><div className="rail-bottom"><button className="rail-button" aria-label="Ayuda y atajos" onClick={() => setModal('help')}><CircleHelp size={20} /></button><span className="user-avatar" title="Espacio de trabajo local">TB</span></div></nav>

    <div className="workspace-shell">
      <header className="topbar"><div className="breadcrumb"><span>Investigaciones</span><ChevronRight size={14} /><button className="project-title" onClick={() => setModal('projects')}>{board.name}<ChevronDown size={14} /></button><span className="stage-badge">Prototipo</span></div><div className="topbar-actions"><div className="history-controls" aria-label="Historial del tablero"><button className="icon-button" disabled={!history?.past.length} onClick={() => applyHistory('undo')} aria-label="Deshacer" title="Deshacer · Ctrl+Z"><Undo2 size={16} /></button><button className="icon-button" disabled={!history?.future.length} onClick={() => applyHistory('redo')} aria-label="Rehacer" title="Rehacer · Ctrl+Shift+Z"><Redo2 size={16} /></button></div><span className={`save-state ${saveStatus}`} role="status">{saveStatus === 'saved' ? <CheckCircle2 size={13} /> : saveStatus === 'error' ? <AlertTriangle size={13} /> : <Clock3 size={13} />}{saveStatus === 'saved' ? 'Guardado local' : saveStatus === 'error' ? 'Sin guardar' : 'Guardando…'}</span><button className="secondary-button export-button" onClick={exportBoard}><ArrowDownToLine size={14} />Exportar</button></div></header>
      {error && <div className="error-banner" role="alert"><AlertTriangle size={16} /><span>{error}</span><button className="text-button" onClick={exportBoard}>Exportar copia</button><button className="icon-button" onClick={() => setError('')} aria-label="Cerrar aviso"><X size={15} /></button></div>}
      <RemoteBoardSave key={board.id} board={board} onSaved={acknowledgeRemoteSave} />
      <div className="workspace-body">
        {sidebar && <aside className="sidebar" aria-label="Recursos y herramientas">
          <div className="sidebar-title"><span>Espacio de investigación</span><button className="icon-button" aria-label="Ocultar barra lateral" onClick={() => setSidebar(false)}><PanelLeftClose size={16} /></button></div>
          <button className="investigation-switch" onClick={() => setModal('projects')}><span className="project-icon"><FolderOpen size={18} /></span><span><strong>{board.name}</strong><small>{board.id === 'inventory' ? 'Bodega Central' : 'Investigación'}</small></span><ChevronDown size={14} /></button>
          <div className="sidebar-section"><div className="section-title">Crear tarjeta<kbd>N</kbd></div>{cardGroups.map(group => <div className="creation-group" key={group.label} role="group" aria-label={group.label}><span className="creation-group-label">{group.label}</span><div className="creation-tools">{group.types.map(type => { const Icon = cardIcons[type]; return <button key={type} className={`create-tool ${type}`} onClick={() => createCard(type)} aria-label={`Añadir ${cardLabels[type].toLowerCase()}`} title={cardLabels[type]}><Icon size={17} /><span>{cardLabels[type]}</span><Plus size={13} /></button>; })}</div></div>)}</div>
          <div className="sidebar-section resource-section"><div className="section-title">Recursos <span className="count">{files.length}</span><button className="icon-button" aria-label="Adjuntar archivos" onClick={() => inputRef.current?.click()} disabled={busy}><Plus size={16} /></button></div>
            {files.map(item => { const Icon = cardIcons[item.kind]; const asset = board.assets.find(asset => asset.id === item.assetId); return <button className={`resource-item ${selected.includes(item.id) ? 'active' : ''}`} key={item.id} onClick={() => focusEntity(item.id)}><span className={`resource-icon ${item.kind}`}><Icon size={16} /></span><span>{asset?.name ?? item.title}<small>{asset ? `${Math.round(asset.size / 1000)} KB` : 'Sin archivo'} {asset?.id.endsWith('-file') ? '· Ejemplo' : ''}</small></span></button>; })}
            <button className="upload-area" onClick={() => inputRef.current?.click()} disabled={busy}><Upload size={17} /><span>{busy ? 'Leyendo archivos…' : 'Añadir archivos'}<small>o arrástralos al lienzo · máx. 10 MB</small></span></button>
          </div>
          <div className="sidebar-section investigation-summary"><div className="section-title">Tu investigación</div><button onClick={() => { setSearch(''); setModal('search'); }}><Network size={15} />Tarjetas<span>{board.entities.length}</span></button><button onClick={openRelation}><Link2 size={15} />Relaciones<span>{board.edges.length}</span></button><button onClick={() => setView('requirements')}><ListChecks size={15} />Requisitos<span>{requirements.length}</span></button></div>
          <div className="sidebar-footer"><span className="local-dot" /><div>Solo en este navegador<small>Exporta una copia para conservarla.</small></div></div>
        </aside>}
        <main className="main-workspace">
          <div className="board-header"><div className="board-tabs">{!sidebar && <button className="icon-button" aria-label="Mostrar barra lateral" onClick={() => setSidebar(true)}><PanelLeftOpen size={17} /></button>}<button className={view === 'board' ? 'active' : ''} onClick={() => setView('board')}><Network size={15} />Tablero de investigación</button><button className={view === 'requirements' ? 'active' : ''} onClick={() => setView('requirements')}><ListChecks size={15} />Requisitos<span>{requirements.length}</span></button></div><button className="icon-button" aria-label="Buscar en la investigación" onClick={() => { setSearch(''); setModal('search'); }}><Search size={16} /></button></div>
          {view === 'board' ? <div className="canvas-container" ref={canvasRef}>
            <div className="canvas-heading"><span className="canvas-count">{board.entities.length} tarjetas · {board.edges.length} relaciones</span></div>
            <BoardCanvas key={board.id} board={board} selected={selected} edgeId={edgeId} pan={pan} minimap={minimap} onSelect={select} onEdge={setEdgeId}
              onPositions={moveCards}
              onDelete={deleteCards} onDeleteEdges={deleteEdges} onConnect={onConnect}
              onInit={flow => { flowRef.current = flow; setZoom(flow.getZoom()); }}
              onViewport={viewport => { setZoom(viewport.zoom); mutate(current => ({ ...current, viewport }), null); }} onPreview={showPreview}
              onAddNote={point => createCard('note', point)} onDropFiles={attachFiles} />
            {!board.entities.length && <div className="empty-board"><Network size={36} /><h2>Toda investigación empieza con una pista.</h2><p>Añade una nota, un documento o un primer hallazgo.</p><button className="primary-button" onClick={() => createCard('note')}><Plus size={16} />Crear primera nota</button></div>}
            <div className="canvas-toolbar" aria-label="Herramientas del lienzo"><button className={pan ? '' : 'active'} onClick={() => setPan(false)} aria-label="Herramienta de selección" title="Seleccionar · V"><MousePointer2 size={18} /></button><button className={pan ? 'active' : ''} onClick={() => setPan(true)} aria-label="Herramienta de paneo" title="Mover lienzo · H"><Hand size={18} /></button><span className="toolbar-divider" /><button onClick={() => createCard('note')} aria-label="Crear nota en el lienzo" title="Nota · N"><Plus size={20} /></button><button onClick={openRelation} aria-label="Crear relación semántica" title="Conectar tarjetas"><Link2 size={18} /></button><span className="toolbar-divider" /><button onClick={() => void flowRef.current?.zoomOut({ duration: 200 })} aria-label="Alejar"><Minus size={16} /></button><span className="zoom-label">{Math.round(zoom * 100)}%</span><button onClick={() => void flowRef.current?.zoomIn({ duration: 200 })} aria-label="Acercar"><Plus size={16} /></button><button onClick={() => void flowRef.current?.fitView({ padding: 0.15, duration: 400 })} aria-label="Ajustar todo el tablero" title="Ajustar tablero · F"><Maximize size={16} /></button><span className="toolbar-divider" /><button className={minimap ? 'active' : ''} onClick={() => setMinimap(!minimap)} aria-label="Alternar minimapa"><Map size={17} /></button></div>
            <div className="canvas-hint"><Command size={12} /><span>Doble clic para una nota</span><span className="hint-divider" />Shift + clic para seleccionar varias</div>
          </div> : <div className="requirements-view"><div className="requirements-heading"><div><h1>Requisitos de la investigación</h1><p>{requirements.length} requisitos · {findings.length} hallazgos que les dan contexto</p></div><button className="primary-button" onClick={() => createCard('requirement')}><Plus size={16} />Nuevo requisito</button></div>{requirements.length ? requirementGroups.filter(group => group.items.length).map(group => <RequirementGroup key={group.title} title={group.title} items={group.items} onOpen={focusEntity} />) : <div className="empty-requirements"><ListChecks size={32} /><p>Aún no hay requisitos. Empieza por conectar tus primeras evidencias.</p></div>}</div>}
        </main>
        {(entity || edge) && <Inspector key={`${entity?.id ?? edge?.id}:${historyStep}`} board={board} entity={entity} edge={edge} onClose={closeInspector} onUpdate={item => mutate(current => updateCard(current, item))} onUpdateEdge={item => mutate(current => updateRelation(current, item, now()), 'Editar relación')} onDelete={() => entity ? deleteCards([entity.id]) : edge && deleteEdges([edge.id])} onNavigate={focusEntity} onPreview={showPreview} onRelate={openRelation} />}
      </div><footer className="statusbar"><span><span className="local-dot" />Espacio local <span className="statusbar-separator" />{board.name}</span><span>{board.entities.length} tarjetas <span className="statusbar-separator" />{board.edges.length} relaciones </span></footer>
    </div>
    <input className="visually-hidden" type="file" ref={inputRef} multiple accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,.xlsx,.xls,.doc,.docx" onChange={event => void attachFiles(Array.from(event.target.files ?? []))} aria-label="Seleccionar archivos" />
    <input className="visually-hidden" type="file" ref={importRef} accept=".json" onChange={event => void importBoard(event.target.files?.[0])} aria-label="Seleccionar copia de investigación" />
    {toast && <div className="toast" role="status"><CheckCircle2 size={17} />{toast}</div>}

    {modal === 'search' && <Dialog title="Buscar en la investigación" onClose={() => setModal(null)}><div className="search-dialog"><div className="search-input"><Search size={18} /><input autoFocus aria-label="Buscar tarjetas" placeholder="Título, contenido o identificador…" value={search} onChange={event => setSearch(event.target.value)} /><kbd>Esc</kbd></div><div className="search-results">{matches.map(item => { const Icon = cardIcons[item.kind]; return <button key={item.id} onClick={() => focusEntity(item.id)}><Icon size={18} /><span>{item.title}<small>{cardLabels[item.kind]} {entityCode(item)}</small></span><ArrowUpRight size={15} /></button>; })}{!matches.length && <p className="muted">No hay tarjetas que coincidan con tu búsqueda.</p>}</div></div></Dialog>}
    {modal === 'projects' && <Dialog title="Tus investigaciones" onClose={() => { setModal(null); setConfirmDelete(null); }}><div className="projects-dialog"><p className="muted">Tus tableros locales se conservan en este navegador.</p>{workspace.investigations.map(item => confirmDelete === item.id ? <div className="project-confirm" key={item.id} role="group" aria-label={`Confirmar eliminación de ${item.name}`}><p><strong>¿Eliminar «{item.name}»?</strong><small>Se borra de este navegador con sus {item.entities.length} tarjetas. {item.remote ? 'La copia en la base de datos no cambia.' : 'Exporta una copia si la necesitas.'}</small></p><div><button className="secondary-button" onClick={() => setConfirmDelete(null)}>Cancelar</button><button className="danger-button solid" onClick={() => deleteLocal(item.id)}><Trash2 size={14} />Eliminar</button></div></div>
            : <div className="project-item" key={item.id}><button className={`project-row ${item.id === board.id ? 'active' : ''}`} onClick={() => changeActive(item.id)}><FolderOpen size={22} /><span><strong>{item.name}</strong><small>{item.entities.length} tarjetas · {item.edges.length} relaciones</small></span>{item.id === board.id ? <Check size={17} /> : <ChevronRight size={17} />}</button><button className="icon-button project-delete" onClick={() => setConfirmDelete(item.id)} disabled={workspace.investigations.length < 2} aria-label={`Eliminar investigación ${item.name}`} title={workspace.investigations.length < 2 ? 'Debe quedar al menos una investigación' : 'Eliminar investigación'}><Trash2 size={15} /></button></div>)}<RemoteInvestigations onOpen={openDatabaseInvestigation} /><form onSubmit={event => { event.preventDefault(); try { const project = createInvestigation(uid(), newProjectName, now()); const next = decodeWorkspace(JSON.stringify({ ...workspace, activeId: project.id, investigations: [...workspace.investigations, project] })); setWorkspace(next); setSaveStatus('pending'); setNewProjectName(''); closeInspector(); setModal(null); } catch { setError('Introduce un nombre válido. Se admiten hasta 30 investigaciones.'); } }}><label>Nueva investigación local<input aria-label="Nombre de investigación" maxLength={120} required placeholder="Ej. Sistema de compras" value={newProjectName} onChange={event => setNewProjectName(event.target.value)} /></label><button className="primary-button" type="submit"><Plus size={15} />Crear investigación</button></form><button className="secondary-button full" onClick={() => importRef.current?.click()}><Upload size={15} />Importar una copia JSON</button></div></Dialog>}
    {modal === 'relation' && <Dialog title="Conectar conocimiento" onClose={() => setModal(null)}><form className="relation-dialog" onSubmit={event => { event.preventDefault(); if (!relationSource || !relationTarget || relationSource === relationTarget) { setError('Selecciona dos tarjetas diferentes.'); return; } if (board.edges.some(edge => edge.sourceId === relationSource && edge.targetId === relationTarget && edge.relation === relationType)) { setError('Esta relación ya existe.'); return; } if (mutate(current => connectCards(current, relationSource, relationTarget, relationType, uid(), now()), 'Crear relación')) { setModal(null); setToast('Relación semántica creada'); } }}><p className="muted">Elige qué conecta estas tarjetas, más allá de una flecha.</p><label>Tarjeta de origen<select aria-label="Tarjeta de origen" value={relationSource} onChange={event => setRelationSource(event.target.value)}>{board.entities.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label>Tipo de relación<select aria-label="Tipo de relación" value={relationType} onChange={event => setRelationType(event.target.value as RelationType)}>{relationTypes.map(type => <option key={type} value={type}>{relationLabels[type]}</option>)}</select></label><label>Tarjeta de destino<select aria-label="Tarjeta de destino" value={relationTarget} onChange={event => setRelationTarget(event.target.value)}>{board.entities.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><div className="relation-example"><span>{board.entities.find(entity => entity.id === relationSource)?.title ?? 'Origen'}</span><strong><Link2 size={14} />{relationLabels[relationType]}</strong><span>{board.entities.find(entity => entity.id === relationTarget)?.title ?? 'Destino'}</span></div><button className="primary-button full" type="submit" disabled={board.entities.length < 2}><Link2 size={16} />Crear relación</button></form></Dialog>}
    {modal === 'help' && <Dialog title="Tu espacio de investigación" onClose={() => setModal(null)}><div className="help-dialog"><p>Mueve tarjetas, conecta los puntos y convierte tus hallazgos en requisitos con fuentes identificables.</p><dl><dt>Deshacer / rehacer</dt><dd><kbd>Ctrl+Z</kbd> / <kbd>Ctrl+Shift+Z</kbd></dd><dt>Crear nota</dt><dd><kbd>N</kbd> o doble clic en el lienzo</dd><dt>Seleccionar / mover lienzo</dt><dd><kbd>V</kbd> / <kbd>H</kbd></dd><dt>Buscar tarjetas</dt><dd><kbd>Ctrl</kbd> + <kbd>K</kbd></dd><dt>Ajustar todo el tablero</dt><dd><kbd>F</kbd></dd><dt>Selección múltiple</dt><dd><kbd>Shift</kbd> + clic</dd><dt>Eliminar selección</dt><dd><kbd>Supr</kbd> / <kbd>Backspace</kbd></dd><dt>Zoom</dt><dd>Ctrl + rueda o controles inferiores</dd></dl><p className="preview-notice">El guardado es local. Exporta una copia antes de borrar los datos del navegador. Los archivos admiten hasta 10 MB; Word y Excel conservan solo metadatos. Los recursos iniciales son ejemplos.</p></div></Dialog>}
    {previewEntity && <PreviewDialog entity={previewEntity} asset={board.assets.find(asset => asset.id === previewEntity.assetId)} onClose={() => setPreviewId(null)} />}
  </div>;
}
