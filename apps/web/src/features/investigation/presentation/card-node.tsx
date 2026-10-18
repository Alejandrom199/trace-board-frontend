'use client';

import { memo, useState } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { FileText, ImageIcon, Lightbulb, StickyNote, Workflow, ListChecks, ArrowUpRight, Ellipsis, Link2 } from 'lucide-react';
import { cardLabels, type Entity, type Asset } from '../domain/model';
import { assetSource } from '../infrastructure/remote-files';

export const cardIcons = { note: StickyNote, document: FileText, image: ImageIcon, finding: Lightbulb, requirement: ListChecks, process: Workflow };
export const priorityLabels = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' };
export const statusLabels = { draft: 'Borrador', review: 'En revisión', approved: 'Aprobado', rejected: 'Rechazado' };
export type CanvasNode = Node<{ entity: Entity; asset?: Asset; connections: number; flowIncoming?: boolean; flowOutgoing?: boolean; preview: (id: string) => void }, 'card'>;

export const CardNode = memo(function CardNode({ data, selected }: NodeProps<CanvasNode>) {
  const { entity, asset, connections } = data;
  const Icon = cardIcons[entity.kind];
  const extension = asset?.name.split('.').pop()?.toUpperCase();
  const source = assetSource(asset);
  const [failedSource, setFailedSource] = useState('');
  return <article className={`knowledge-card ${entity.kind} ${selected ? 'is-selected' : ''}`} data-testid={`card-${entity.id}`}>
    <Handle type="target" position={Position.Left} aria-label="Entrada de relación" />
    {data.flowIncoming && <Handle id="flow-in" type="target" position={Position.Top} aria-label="Entrada del recorrido" />}
    <div className="card-top"><span className="card-category"><Icon size={14} />{cardLabels[entity.kind]}</span><span className="card-ref">{entity.requirement?.code ?? (entity.kind === 'finding' ? `H-${entity.id === 'finding-trace' ? '001' : entity.id === 'finding-stock' ? '002' : entity.id.slice(0, 4)}` : <Ellipsis size={15} />)}</span></div>
    {entity.kind === 'image' && source && <button className="card-image nodrag" onClick={() => data.preview(entity.id)} aria-label={`Previsualizar ${entity.title}`}>
      {/* Local uploads and an authored SVG cannot use a remote image optimizer. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {failedSource === source ? <p>Vista previa no disponible. Abre el archivo para reintentar.</p> : <img src={source} alt={entity.title} draggable={false} onError={() => setFailedSource(source)} />}
      <span><ArrowUpRight size={15} /></span>
    </button>}
    <h3>{entity.title}</h3>
    <p className={entity.kind === 'document' && asset?.mime === 'application/pdf' ? 'quote' : ''}>{entity.description || 'Añade contexto desde el inspector.'}</p>
    {entity.kind === 'document' && asset && <button className="file-chip nodrag" onClick={() => data.preview(entity.id)} title="Previsualizar documento"><span className={`extension ${extension === 'XLSX' ? 'excel' : ''}`}>{extension}</span><span>{asset.name}<small>{Math.round(asset.size / 1000)} KB</small></span><ArrowUpRight size={14} /></button>}
    {entity.requirement && <div className="requirement-chips"><span className={`priority ${entity.requirement.priority}`}><span />{priorityLabels[entity.requirement.priority]}</span><span className={`status ${entity.requirement.status}`}>{statusLabels[entity.requirement.status]}</span></div>}
    <div className="card-bottom"><span><Link2 size={12} />{connections} {connections === 1 ? 'conexión' : 'conexiones'}</span>{entity.kind === 'document' ? <span>Fuente de investigación</span> : entity.kind === 'requirement' ? <span>{entity.requirement?.criteria.length ?? 0} criterios</span> : <span>Investigación</span>}</div>
    <Handle type="source" position={Position.Right} aria-label="Salida de relación" />
    {data.flowOutgoing && <Handle id="flow-out" type="source" position={Position.Bottom} aria-label="Salida del recorrido" />}
  </article>;
});
