'use client';
import { useState } from 'react';
import { X, Link2, ArrowDownLeft, ArrowUpRight, Trash2, FileText, Plus, Check, ChevronRight } from 'lucide-react';
import { cardLabels, evidenceFor, relationLabels, relationTypes, type Entity, type Investigation, type Relation, type RelationType } from '../domain/model';
import { cardIcons, priorityLabels, statusLabels } from './card-node';

interface Props {
  board: Investigation; entity?: Entity; edge?: Relation;
  onClose: () => void; onUpdate: (entity: Entity) => boolean; onUpdateEdge: (edge: Relation) => boolean;
  onDelete: () => void; onNavigate: (id: string) => void; onPreview: (id: string) => void; onRelate: () => void;
}
export function Inspector(props: Props) {
  const { entity, edge, board } = props;
  const [draft, setDraft] = useState(entity);
  const [edgeDraft, setEdgeDraft] = useState(edge);
  const [tab, setTab] = useState<'properties' | 'relations'>('properties');
  const [feedback, setFeedback] = useState('');
  if (edge && edgeDraft) return <aside className="inspector" aria-label="Inspector de relación">
    <div className="inspector-heading"><span><Link2 size={16} />Relación semántica</span><button className="icon-button" onClick={props.onClose} aria-label="Cerrar inspector"><X size={17} /></button></div>
    <div className="inspector-content"><span className="field-label">Origen</span><button className="endpoint" onClick={() => props.onNavigate(edge.sourceId)}>{board.entities.find(item => item.id === edge.sourceId)?.title}<ArrowUpRight size={15} /></button>
      <label>Significado<select value={edgeDraft.relation} onChange={event => setEdgeDraft({ ...edgeDraft, relation: event.target.value as RelationType })}>{relationTypes.map(type => <option key={type} value={type}>{relationLabels[type]}</option>)}</select></label>
      <span className="field-label">Destino</span><button className="endpoint" onClick={() => props.onNavigate(edge.targetId)}>{board.entities.find(item => item.id === edge.targetId)?.title}<ArrowUpRight size={15} /></button>
      <label>Descripción<textarea rows={4} maxLength={2000} value={edgeDraft.description} onChange={event => setEdgeDraft({ ...edgeDraft, description: event.target.value })} placeholder="¿Qué explica esta conexión?" /></label>
      <button className="primary-button full" onClick={() => props.onUpdateEdge(edgeDraft)}><Check size={15} />Guardar relación</button>
    </div><div className="inspector-footer"><button className="danger-button" onClick={props.onDelete}><Trash2 size={14} />Eliminar relación</button></div>
  </aside>;
  if (!entity || !draft) return null;
  const Icon = cardIcons[entity.kind];
  const incoming = board.edges.filter(edge => edge.targetId === entity.id);
  const outgoing = board.edges.filter(edge => edge.sourceId === entity.id);
  const evidence = evidenceFor(board, entity.id);
  const asset = board.assets.find(asset => asset.id === entity.assetId);
  const dirty = JSON.stringify(draft) !== JSON.stringify(entity);
  const save = () => {
    if (!draft.title.trim()) { setFeedback('El título no puede estar vacío.'); return; }
    if (draft.requirement && !draft.requirement.code.trim()) { setFeedback('El identificador no puede estar vacío.'); return; }
    const applied = { ...draft, title: draft.title.trim(), updatedAt: new Date().toISOString() };
    const success = props.onUpdate(applied); if (success) setDraft(applied); setFeedback(success ? 'Cambios aplicados' : 'No se pudo aplicar el cambio. Revisa los campos.');
  };
  const renderRelation = (relation: Relation, incoming: boolean) => {
    const other = board.entities.find(item => item.id === (incoming ? relation.sourceId : relation.targetId));
    return <button className="relation-row" key={relation.id} onClick={() => other && props.onNavigate(other.id)}><span className="relation-direction">{incoming ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}</span><span><small>{relationLabels[relation.relation]}</small>{other?.title}</span><ChevronRight size={13} /></button>;
  };
  return <aside className="inspector" aria-label="Inspector de tarjeta">
    <div className="inspector-heading"><span>Inspector</span><button className="icon-button" onClick={props.onClose} aria-label="Cerrar inspector"><X size={17} /></button></div>
    <div className={`inspector-identity ${entity.kind}`}><span className="identity-icon"><Icon size={20} /></span><div><small>{cardLabels[entity.kind]} {entity.requirement?.code}</small><h2>{entity.title}</h2></div></div>
    <div className="inspector-tabs"><button className={tab === 'properties' ? 'active' : ''} onClick={() => setTab('properties')}>Propiedades</button><button className={tab === 'relations' ? 'active' : ''} onClick={() => setTab('relations')}>Relaciones <span>{incoming.length + outgoing.length}</span></button></div>
    <div className="inspector-content">
      {tab === 'properties' ? <>
        <label>Título<input aria-label="Título de tarjeta" maxLength={200} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} /></label>
        <label>Descripción<textarea aria-label="Descripción de tarjeta" maxLength={10000} rows={5} placeholder="Añade contexto a tu investigación…" value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} /></label>
        {draft.requirement && <>
          <label>Identificador<input maxLength={40} value={draft.requirement.code} onChange={event => setDraft({ ...draft, requirement: { ...draft.requirement!, code: event.target.value } })} /></label>
          <div className="field-pair"><label>Prioridad<select value={draft.requirement.priority} onChange={event => setDraft({ ...draft, requirement: { ...draft.requirement!, priority: event.target.value as NonNullable<Entity['requirement']>['priority'] } })}>{Object.entries(priorityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label>Estado<select value={draft.requirement.status} onChange={event => setDraft({ ...draft, requirement: { ...draft.requirement!, status: event.target.value as NonNullable<Entity['requirement']>['status'] } })}>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div>
          <label>Criterios de aceptación<textarea rows={5} maxLength={10000} value={draft.requirement.criteria.join('\n')} onChange={event => setDraft({ ...draft, requirement: { ...draft.requirement!, criteria: event.target.value.split('\n').slice(0, 40) } })} placeholder="Un criterio por línea" /></label>
        </>}
        <button className="primary-button full" disabled={!dirty} onClick={save}><Check size={15} />Guardar cambios</button>
        {feedback && <p className="inline-feedback" role="status">{feedback}</p>}
        {asset && <section className="inspector-section"><h3>Archivo asociado</h3><button className="attachment" onClick={() => props.onPreview(entity.id)}><FileText size={18} /><span>{asset.name}<small>{Math.round(asset.size / 1000)} KB · {asset.remoteFile ? 'Original guardado en backend' : asset.url ? 'Vista previa local' : 'Metadatos'}</small></span><ArrowUpRight size={15} /></button></section>}
        {entity.kind === 'requirement' && <section className="inspector-section"><h3>Evidencias de origen <span>{evidence.length}</span></h3>{evidence.length ? evidence.map(source => <button className="evidence-row" key={source.id} onClick={() => props.onNavigate(source.id)}><FileText size={15} /><span>{source.title}</span><ChevronRight size={13} /></button>) : <p className="muted">Conecta una fuente mediante Evidencia u Origina.</p>}</section>}
        <section className="inspector-section"><h3>Contexto de investigación</h3><p className="muted">{board.name}</p><small className="muted">Creada el {new Date(entity.createdAt).toLocaleDateString('es-EC')}</small></section>
      </> : <>
        <section className="inspector-section"><h3>Relaciones entrantes <span>{incoming.length}</span></h3>{incoming.map(edge => renderRelation(edge, true))}{!incoming.length && <p className="muted">Todavía no hay fuentes conectadas.</p>}</section>
        <section className="inspector-section"><h3>Relaciones salientes <span>{outgoing.length}</span></h3>{outgoing.map(edge => renderRelation(edge, false))}{!outgoing.length && <p className="muted">Esta tarjeta aún no conecta con otras.</p>}</section>
        <button className="secondary-button full" onClick={props.onRelate}><Plus size={15} />Añadir relación</button>
      </>}
    </div><div className="inspector-footer"><button className="danger-button" onClick={props.onDelete}><Trash2 size={14} />Eliminar tarjeta</button><span className="muted">{dirty ? 'Sin aplicar' : 'Cambios aplicados'}</span></div>
  </aside>;
}
