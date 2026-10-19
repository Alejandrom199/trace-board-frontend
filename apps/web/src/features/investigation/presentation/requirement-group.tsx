'use client';
import { ArrowUpRight } from 'lucide-react';
import type { Entity } from '../domain/model';
import { priorityLabels, qualityLabels, statusLabels } from './labels';

interface Props { title: string; items: Entity[]; onOpen: (id: string) => void }
/** Tabla de requisitos de un mismo tipo (funcionales o no funcionales). */
export function RequirementGroup({ title, items, onOpen }: Props) {
  return <section className="requirements-group" aria-label={title}><h2>{title}<span>{items.length}</span></h2><div className="requirements-table"><div className="table-heading"><span>Identificador / requisito</span><span>Prioridad</span><span>Estado</span></div>
    {items.map(item => <button className="requirement-table-row" key={item.id} onClick={() => onOpen(item.id)}><span><small>{item.requirement?.code}{item.requirement?.category ? ` · ${qualityLabels[item.requirement.category]}` : ''}</small><strong>{item.title}</strong><p>{item.description}</p></span><span className={`priority ${item.requirement?.priority}`}>{item.requirement ? priorityLabels[item.requirement.priority] : ''}</span><span className="status">{item.requirement ? statusLabels[item.requirement.status] : ''}<ArrowUpRight size={15} /></span></button>)}
  </div></section>;
}
