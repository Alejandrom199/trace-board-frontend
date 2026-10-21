'use client';

import { memo, useState } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { FileText, ImageIcon, Lightbulb, StickyNote, Workflow, ListChecks, ArrowUpRight, Ellipsis, Link2, OctagonAlert, CircleHelp, UserRound, Scale, Server, Gavel, type LucideIcon } from 'lucide-react';
import { cardLabels, entityCode, type CardType, type Entity, type Asset } from '../domain/model';
import { assetSource } from '../infrastructure/remote-files';
import { actorLabels, decisionStatusLabels, priorityLabels, problemStatusLabels, qualityLabels, questionStatusLabels, statusLabels } from './labels';

export const cardIcons: Record<CardType, LucideIcon> = {
  note: StickyNote, document: FileText, image: ImageIcon, finding: Lightbulb, problem: OctagonAlert, question: CircleHelp, actor: UserRound,
  process: Workflow, business_rule: Scale, external_system: Server, requirement: ListChecks, decision: Gavel,
};
function footer(entity: Entity): string {
  if (entity.requirement) return `${entity.requirement.criteria.length} criterios`;
  if (entity.question) return entity.question.answer.trim() ? 'Con respuesta' : 'Sin respuesta';
  if (entity.decision) return entity.decision.rationale.trim() ? 'Con justificación' : 'Sin justificación';
  return entity.kind === 'document' ? 'Fuente de investigación' : 'Investigación';
}
export type CanvasNode = Node<{ entity: Entity; asset?: Asset; connections: number; flowIncoming?: boolean; flowOutgoing?: boolean; preview: (id: string) => void }, 'card'>;

// Figura de actor de diagrama de casos de uso: cabeza, tronco, brazos y piernas en trazo simple.
function ActorGlyph() {
  return <svg viewBox="0 0 40 56" width="40" height="56" aria-hidden="true">
    <circle cx="20" cy="9" r="8" />
    <line x1="20" y1="17" x2="20" y2="38" />
    <line x1="20" y1="23" x2="5" y2="31" />
    <line x1="20" y1="23" x2="35" y2="31" />
    <line x1="20" y1="38" x2="7" y2="55" />
    <line x1="20" y1="38" x2="33" y2="55" />
  </svg>;
}

export const CardNode = memo(function CardNode({ data, selected }: NodeProps<CanvasNode>) {
  const { entity, asset, connections } = data;
  const Icon = cardIcons[entity.kind];
  const extension = asset?.name.split('.').pop()?.toUpperCase();
  const source = assetSource(asset);
  const [failedSource, setFailedSource] = useState('');
  if (entity.kind === 'actor') return <article className={`knowledge-card actor-figure ${selected ? 'is-selected' : ''}`} data-testid={`card-${entity.id}`}>
    <Handle type="target" position={Position.Left} aria-label="Entrada de relación" />
    <ActorGlyph />
    <h3>{entity.title}</h3>
    {entity.actor && <span className="kind-chip">{actorLabels[entity.actor.category]}</span>}
    {entity.description && <p>{entity.description}</p>}
    <span className="actor-connections"><Link2 size={11} />{connections}</span>
    <Handle type="source" position={Position.Right} aria-label="Salida de relación" />
  </article>;
  return <article className={`knowledge-card ${entity.kind} ${selected ? 'is-selected' : ''}`} data-testid={`card-${entity.id}`}>
    <Handle type="target" position={Position.Left} aria-label="Entrada de relación" />
    {data.flowIncoming && <Handle id="flow-in" type="target" position={Position.Top} aria-label="Entrada del recorrido" />}
    <div className="card-top"><span className="card-category"><Icon size={14} />{cardLabels[entity.kind]}</span><span className="card-ref">{entityCode(entity) ?? <Ellipsis size={15} />}</span></div>
    {entity.kind === 'image' && source && <button className="card-image nodrag" onClick={() => data.preview(entity.id)} aria-label={`Previsualizar ${entity.title}`}>
      {/* Local uploads and an authored SVG cannot use a remote image optimizer. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {failedSource === source ? <p>Vista previa no disponible. Abre el archivo para reintentar.</p> : <img src={source} alt={entity.title} draggable={false} onError={() => setFailedSource(source)} />}
      <span><ArrowUpRight size={15} /></span>
    </button>}
    <h3>{entity.title}</h3>
    <p className={entity.kind === 'document' && asset?.mime === 'application/pdf' ? 'quote' : ''}>{entity.description || 'Añade contexto desde el inspector.'}</p>
    {entity.kind === 'document' && asset && <button className="file-chip nodrag" onClick={() => data.preview(entity.id)} title="Previsualizar documento"><span className={`extension ${extension === 'XLSX' ? 'excel' : ''}`}>{extension}</span><span>{asset.name}<small>{Math.round(asset.size / 1000)} KB</small></span><ArrowUpRight size={14} /></button>}
    {entity.requirement && <div className="requirement-chips"><span className="kind-chip">{entity.requirement.category ? `RNF · ${qualityLabels[entity.requirement.category]}` : 'Funcional'}</span><span className={`priority ${entity.requirement.priority}`}><span />{priorityLabels[entity.requirement.priority]}</span><span className={`status ${entity.requirement.status}`}>{statusLabels[entity.requirement.status]}</span></div>}
    {entity.problem && <div className="requirement-chips"><span className={`priority ${entity.problem.severity}`}><span />Severidad {priorityLabels[entity.problem.severity].toLowerCase()}</span><span className={`status ${entity.problem.status}`}>{problemStatusLabels[entity.problem.status]}</span></div>}
    {entity.question && <div className="requirement-chips"><span className={`status ${entity.question.status}`}>{questionStatusLabels[entity.question.status]}</span></div>}
    {entity.decision && <div className="requirement-chips"><span className={`status ${entity.decision.status}`}>{decisionStatusLabels[entity.decision.status]}</span></div>}
    {entity.actor && <div className="requirement-chips"><span className="kind-chip">{actorLabels[entity.actor.category]}</span></div>}
    <div className="card-bottom"><span><Link2 size={12} />{connections} {connections === 1 ? 'conexión' : 'conexiones'}</span><span>{footer(entity)}</span></div>
    <Handle type="source" position={Position.Right} aria-label="Salida de relación" />
    {data.flowOutgoing && <Handle id="flow-out" type="source" position={Position.Bottom} aria-label="Salida del recorrido" />}
  </article>;
});
