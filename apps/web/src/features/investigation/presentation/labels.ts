import type { Entity } from '../domain/model';

type Attributes<K extends keyof Entity> = NonNullable<Entity[K]>;
export const priorityLabels: Record<Attributes<'requirement'>['priority'], string> = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' };
export const statusLabels: Record<Attributes<'requirement'>['status'], string> = { draft: 'Borrador', review: 'En revisión', approved: 'Aprobado', rejected: 'Rechazado' };
export const requirementTypeLabels: Record<Attributes<'requirement'>['type'], string> = { functional: 'Funcional', non_functional: 'No funcional' };
export const qualityLabels: Record<NonNullable<Attributes<'requirement'>['category']>, string> = {
  performance: 'Rendimiento', security: 'Seguridad', usability: 'Usabilidad', reliability: 'Fiabilidad',
  compatibility: 'Compatibilidad', maintainability: 'Mantenibilidad', portability: 'Portabilidad', other: 'Otra',
};
export const actorLabels: Record<Attributes<'actor'>['category'], string> = { user: 'Usuario', stakeholder: 'Interesado', area: 'Área' };
export const problemStatusLabels: Record<Attributes<'problem'>['status'], string> = { open: 'Abierto', resolved: 'Resuelto' };
export const questionStatusLabels: Record<Attributes<'question'>['status'], string> = { open: 'Abierta', answered: 'Respondida', discarded: 'Descartada' };
export const decisionStatusLabels: Record<Attributes<'decision'>['status'], string> = { proposed: 'Propuesta', accepted: 'Aceptada', rejected: 'Rechazada', superseded: 'Reemplazada' };
