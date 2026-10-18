'use client';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, getSmoothStepPath, type Edge, type EdgeProps } from '@xyflow/react';
import { relationLabels, type RelationType } from '../domain/model';

export type CanvasEdge = Edge<{ relation: RelationType; flow?: boolean }, 'semantic'>;
export function SemanticEdge({ id, data, selected, markerEnd, ...coordinates }: EdgeProps<CanvasEdge>) {
  const [path, x, y] = data?.flow ? getSmoothStepPath({ ...coordinates, borderRadius: 12 }) : getBezierPath({ ...coordinates, curvature: 0.35 });
  return <>
    <BaseEdge id={id} path={path} markerEnd={markerEnd} style={{ stroke: selected ? '#b4a0fb' : data?.relation === 'originates' ? '#8373ae' : '#48505e', strokeWidth: selected ? 2.5 : 1.5, strokeDasharray: data?.relation === 'depends_on' ? '6 5' : undefined }} interactionWidth={24} />
    <EdgeLabelRenderer><div className={`edge-label nodrag nopan ${selected ? 'selected' : ''}`} style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}>{data?.flow && data.relation === 'related_to' ? 'Continúa' : data ? relationLabels[data.relation] : ''}</div></EdgeLabelRenderer>
  </>;
}
