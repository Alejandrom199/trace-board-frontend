'use client';
import { withRequirementType } from '../application/actions';
import { actorCategories, decisionStatuses, priorities, problemStatuses, qualityCategories, questionStatuses, requirementTypes, type Entity, type Investigation } from '../domain/model';
import { actorLabels, decisionStatusLabels, priorityLabels, problemStatusLabels, qualityLabels, questionStatusLabels, requirementTypeLabels, statusLabels } from './labels';

interface Props { board: Investigation; draft: Entity; onChange: (entity: Entity) => void }
function options<T extends string>(values: readonly T[], labels: Record<T, string>) {
  return values.map(value => <option key={value} value={value}>{labels[value]}</option>);
}
/** Busca el valor elegido en la lista permitida en lugar de confiar en el texto del control. */
function pick<T extends string>(values: readonly T[], value: string): T | undefined {
  return values.find(item => item === value);
}

/** Campos estructurados propios de cada tipo de tarjeta. */
export function EntityFields({ board, draft, onChange }: Props) {
  const { requirement, actor, problem, businessRule, question, decision } = draft;
  if (requirement) return <>
    <div className="field-pair"><label>Identificador<input aria-label="Identificador" maxLength={40} value={requirement.code} onChange={event => onChange({ ...draft, requirement: { ...requirement, code: event.target.value } })} /></label>
      <label>Tipo<select aria-label="Tipo de requisito" value={requirement.type} onChange={event => { const type = pick(requirementTypes, event.target.value); if (type) onChange(withRequirementType(board, draft, type)); }}>{options(requirementTypes, requirementTypeLabels)}</select></label></div>
    {requirement.category && <label>Característica de calidad<select aria-label="Característica de calidad" value={requirement.category} onChange={event => { const category = pick(qualityCategories, event.target.value); if (category) onChange({ ...draft, requirement: { ...requirement, category } }); }}>{options(qualityCategories, qualityLabels)}</select></label>}
    <div className="field-pair"><label>Prioridad<select aria-label="Prioridad" value={requirement.priority} onChange={event => { const priority = pick(priorities, event.target.value); if (priority) onChange({ ...draft, requirement: { ...requirement, priority } }); }}>{options(priorities, priorityLabels)}</select></label>
      <label>Estado<select aria-label="Estado del requisito" value={requirement.status} onChange={event => { const status = pick(['draft', 'review', 'approved', 'rejected'] as const, event.target.value); if (status) onChange({ ...draft, requirement: { ...requirement, status } }); }}>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div>
    <label>Criterios de aceptación<textarea aria-label="Criterios de aceptación" rows={5} maxLength={10000} value={requirement.criteria.join('\n')} onChange={event => onChange({ ...draft, requirement: { ...requirement, criteria: event.target.value.split('\n').slice(0, 40) } })} placeholder="Un criterio por línea" /></label>
  </>;
  if (actor) return <label>Categoría<select aria-label="Categoría del actor" value={actor.category} onChange={event => { const category = pick(actorCategories, event.target.value); if (category) onChange({ ...draft, actor: { category } }); }}>{options(actorCategories, actorLabels)}</select></label>;
  if (problem) return <div className="field-pair">
    <label>Severidad<select aria-label="Severidad" value={problem.severity} onChange={event => { const severity = pick(priorities, event.target.value); if (severity) onChange({ ...draft, problem: { ...problem, severity } }); }}>{options(priorities, priorityLabels)}</select></label>
    <label>Estado<select aria-label="Estado del problema" value={problem.status} onChange={event => { const status = pick(problemStatuses, event.target.value); if (status) onChange({ ...draft, problem: { ...problem, status } }); }}>{options(problemStatuses, problemStatusLabels)}</select></label>
  </div>;
  if (businessRule) return <label>Identificador<input aria-label="Identificador" maxLength={40} value={businessRule.code} onChange={event => onChange({ ...draft, businessRule: { code: event.target.value } })} /></label>;
  if (question) return <>
    <label>Estado<select aria-label="Estado de la pregunta" value={question.status} onChange={event => { const status = pick(questionStatuses, event.target.value); if (status) onChange({ ...draft, question: { ...question, status } }); }}>{options(questionStatuses, questionStatusLabels)}</select></label>
    <label>Respuesta<textarea aria-label="Respuesta" rows={4} maxLength={5000} value={question.answer} onChange={event => onChange({ ...draft, question: { ...question, answer: event.target.value } })} placeholder="¿Qué se respondió y quién lo confirmó?" /></label>
  </>;
  if (decision) return <>
    <div className="field-pair"><label>Identificador<input aria-label="Identificador" maxLength={40} value={decision.code} onChange={event => onChange({ ...draft, decision: { ...decision, code: event.target.value } })} /></label>
      <label>Estado<select aria-label="Estado de la decisión" value={decision.status} onChange={event => { const status = pick(decisionStatuses, event.target.value); if (status) onChange({ ...draft, decision: { ...decision, status } }); }}>{options(decisionStatuses, decisionStatusLabels)}</select></label></div>
    <label>Justificación<textarea aria-label="Justificación" rows={4} maxLength={5000} value={decision.rationale} onChange={event => onChange({ ...draft, decision: { ...decision, rationale: event.target.value } })} placeholder="¿Por qué se tomó y qué alternativas se descartaron?" /></label>
  </>;
  return null;
}
