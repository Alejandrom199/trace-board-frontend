'use client';
import { useRef, useState } from 'react';
import { Upload, Loader2, AlertTriangle, Check } from 'lucide-react';
import type { AiGeneratedFlow, AiGenerateFlowResponse } from '@traceboard/contracts';
import { generateFlowFromDocument, AI_DOCUMENT_ACCEPT, MAX_AI_DOCUMENT_BYTES } from '../infrastructure/ai-flow';
import { cardLabels, relationLabels } from '../domain/model';
import { cardIcons } from './card-node';
import { actorLabels } from './labels';
import { Dialog } from './dialogs';

type Status = 'idle' | 'loading' | 'review' | 'error';
interface Props { onClose: () => void; onApply: (flow: AiGeneratedFlow, acceptedRefs: Set<string>) => void }

/** Sube un documento, muestra el flujo propuesto por la IA y deja aceptar/descartar cada tarjeta antes de añadirlas al tablero. */
export function AiGenerateDialog({ onClose, onApply }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<AiGenerateFlowResponse | null>(null);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = async (file?: File) => {
    if (!file) return;
    setStatus('loading'); setError('');
    try {
      const response = await generateFlowFromDocument(file);
      setResult(response); setAccepted(new Set(response.flow.entities.map(entity => entity.ref))); setStatus('review');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo generar el flujo.'); setStatus('error'); }
    finally { if (inputRef.current) inputRef.current.value = ''; }
  };
  const toggle = (ref: string) => setAccepted(current => { const next = new Set(current); if (next.has(ref)) next.delete(ref); else next.add(ref); return next; });
  const titleFor = (ref: string) => result?.flow.entities.find(entity => entity.ref === ref)?.title ?? ref;
  const visibleRelations = result?.flow.relations.filter(relation => accepted.has(relation.from) && accepted.has(relation.to)) ?? [];

  return <Dialog title="Generar flujo con IA" onClose={onClose} wide>
    <div className="ai-generate-dialog">
      {status === 'idle' && <>
        <p className="muted">Sube un PDF con texto, o un archivo .txt/.md, y una IA gratuita de Hugging Face propondrá actores, procesos y reglas de negocio para revisar antes de añadirlos al tablero.</p>
        <button className="upload-area" onClick={() => inputRef.current?.click()}><Upload size={17} /><span>Elegir documento<small>máx. {Math.round(MAX_AI_DOCUMENT_BYTES / (1024 * 1024))} MB · PDF, TXT o MD</small></span></button>
      </>}
      {status === 'loading' && <div className="ai-generate-status" role="status"><Loader2 size={22} className="spin" /><p>Analizando el documento con IA…</p></div>}
      {status === 'error' && <div className="ai-generate-status" role="alert"><AlertTriangle size={22} /><p>{error}</p><button className="secondary-button" onClick={() => setStatus('idle')}>Volver a intentar</button></div>}
      {status === 'review' && result && <>
        {result.truncated && <p className="ai-truncated-notice"><AlertTriangle size={14} />Solo se analizaron los primeros caracteres del documento; revisa si falta algo importante.</p>}
        <p className="muted">Marca lo que quieras añadir al tablero. Las relaciones solo se crean entre tarjetas aceptadas.</p>
        <ul className="ai-proposal-list">
          {result.flow.entities.map(proposed => { const Icon = cardIcons[proposed.kind]; return <li key={proposed.ref}>
            <label>
              <input type="checkbox" checked={accepted.has(proposed.ref)} onChange={() => toggle(proposed.ref)} aria-label={`Añadir ${proposed.title}`} />
              <span className="ai-proposal-body">
                <span className="ai-proposal-kind"><Icon size={14} />{cardLabels[proposed.kind]}{proposed.actor ? ` · ${actorLabels[proposed.actor.category]}` : ''}</span>
                <strong>{proposed.title}</strong>
                {proposed.description && <small>{proposed.description}</small>}
              </span>
            </label>
          </li>; })}
        </ul>
        {Boolean(visibleRelations.length) && <div className="ai-proposal-relations"><span className="section-title">Relaciones que se crearán</span><ul>
          {visibleRelations.map((relation, index) => <li key={index}>{titleFor(relation.from)} <strong>{relationLabels[relation.relation]}</strong> {titleFor(relation.to)}</li>)}
        </ul></div>}
        <div className="dialog-actions">
          <button className="secondary-button" onClick={onClose}>Cancelar</button>
          <button className="primary-button" disabled={!accepted.size} onClick={() => onApply(result.flow, accepted)}><Check size={16} />Añadir {accepted.size} al tablero</button>
        </div>
      </>}
      <input className="visually-hidden" type="file" ref={inputRef} accept={AI_DOCUMENT_ACCEPT} onChange={event => void pick(event.target.files?.[0])} aria-label="Seleccionar documento para generar flujo con IA" />
    </div>
  </Dialog>;
}
