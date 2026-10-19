'use client';
import { useMemo, useCallback, useState } from 'react';
import { ReactFlow, Background, BackgroundVariant, MiniMap, MarkerType, type Connection, type NodeChange, type EdgeChange, type ReactFlowInstance, type Viewport } from '@xyflow/react';
import { CardNode, type CanvasNode } from './card-node';
import { SemanticEdge, type CanvasEdge } from './semantic-edge';
import type { CardType, Investigation } from '../domain/model';

const nodeTypes = { card: CardNode };
const edgeTypes = { semantic: SemanticEdge };
const minimapColors: Partial<Record<CardType, string>> = {
  requirement: '#8373c4', finding: '#c59953', problem: '#b9665c', question: '#6f8fc0', actor: '#5f9ea8', business_rule: '#b98552', decision: '#a9709c', external_system: '#7c8496',
};
export const toCanvasId = (id: string) => `card:${id}`;
export const fromCanvasId = (id: string) => id.slice(5);

interface Props {
  board: Investigation; selected: string[]; edgeId: string | null; pan: boolean; minimap: boolean;
  onSelect: (ids: string[]) => void; onEdge: (id: string | null) => void;
  onPositions: (changes: { id: string; x: number; y: number; dragging?: boolean }[]) => void;
  onDelete: (ids: string[]) => void; onDeleteEdges: (ids: string[]) => void;
  onConnect: (connection: Connection) => void; onInit: (flow: ReactFlowInstance<CanvasNode, CanvasEdge>) => void;
  onViewport: (viewport: Viewport) => void; onPreview: (id: string) => void;
  onAddNote: (position: { x: number; y: number }) => void;
  onDropFiles: (files: File[], position: { x: number; y: number }) => void;
}
export function BoardCanvas(props: Props) {
  // Measurements belong to the editor, never to knowledge entities or persistence.
  const [measurements, setMeasurements] = useState<Record<string, { width: number; height: number }>>({});
  const { board, selected, edgeId, onSelect, onPositions, onDelete, onDeleteEdges, onEdge } = props;
  // Routes between rows use the gap below/above cards instead of crossing the process.
  // This is a canvas projection; persisted relations and positions stay unchanged.
  const downwardFlow = useMemo(() => new Set(board.edges.filter(edge => {
    if (edge.metadata.categoria !== 'flujo') return false;
    const source = board.elements.find(element => element.nodeId === edge.sourceId);
    const target = board.elements.find(element => element.nodeId === edge.targetId);
    return source && target && target.y > source.y + 100;
  }).map(edge => edge.id)), [board.edges, board.elements]);
  const nodes = useMemo<CanvasNode[]>(() => board.entities.map(entity => {
    const element = board.elements.find(item => item.nodeId === entity.id);
    return { id: toCanvasId(entity.id), type: 'card', position: { x: element?.x ?? 0, y: element?.y ?? 0 }, selected: selected.includes(entity.id), measured: measurements[entity.id],
      data: { entity, asset: board.assets.find(asset => asset.id === entity.assetId), connections: board.edges.filter(edge => edge.sourceId === entity.id || edge.targetId === entity.id).length,
        flowIncoming: board.edges.some(edge => edge.targetId === entity.id && downwardFlow.has(edge.id)), flowOutgoing: board.edges.some(edge => edge.sourceId === entity.id && downwardFlow.has(edge.id)), preview: props.onPreview },
    };
  }), [board, selected, props.onPreview, measurements, downwardFlow]);
  const edges = useMemo<CanvasEdge[]>(() => board.edges.map(edge => ({ id: edge.id, source: toCanvasId(edge.sourceId), target: toCanvasId(edge.targetId),
    sourceHandle: downwardFlow.has(edge.id) ? 'flow-out' : undefined, targetHandle: downwardFlow.has(edge.id) ? 'flow-in' : undefined,
    type: 'semantic', selected: edge.id === edgeId, data: { relation: edge.relation, flow: edge.metadata.categoria === 'flujo' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#747080', width: 18, height: 18 } })), [board.edges, edgeId, downwardFlow]);
  const onNodesChange = useCallback((changes: NodeChange<CanvasNode>[]) => {
    const dimensions = changes.filter(change => change.type === 'dimensions');
    if (dimensions.length) setMeasurements(current => {
      const next = { ...current };
      for (const change of dimensions) if (change.dimensions) next[fromCanvasId(change.id)] = change.dimensions;
      return next;
    });
    const positions = changes.flatMap(change => change.type === 'position' && change.position ? [{ id: fromCanvasId(change.id), ...change.position, dragging: change.dragging }] : []);
    if (positions.length) onPositions(positions);
    const removed = changes.flatMap(change => change.type === 'remove' ? [fromCanvasId(change.id)] : []);
    if (removed.length) onDelete(removed);
    const selections = changes.filter(change => change.type === 'select');
    if (selections.length) {
      const ids = new Set(selected);
      for (const change of selections) { if (change.selected) ids.add(fromCanvasId(change.id)); else ids.delete(fromCanvasId(change.id)); }
      onSelect([...ids]);
    }
  }, [onPositions, onDelete, onSelect, selected]);
  const onEdgesChange = useCallback((changes: EdgeChange<CanvasEdge>[]) => {
    const removed = changes.flatMap(change => change.type === 'remove' ? [change.id] : []);
    if (removed.length) onDeleteEdges(removed);
  }, [onDeleteEdges]);
  return <ReactFlow<CanvasNode, CanvasEdge>
    nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
    onConnect={props.onConnect} onInit={props.onInit} fitView={!board.viewport} defaultViewport={board.viewport} fitViewOptions={{ padding: 0.12, maxZoom: 0.95 }}
    minZoom={0.15} maxZoom={2} colorMode="dark" deleteKeyCode={null} selectionOnDrag={!props.pan} panOnDrag={props.pan ? true : [1, 2]} panOnScroll zoomOnScroll={false} zoomActivationKeyCode="Control" multiSelectionKeyCode="Shift"
    onMoveEnd={(_, viewport) => props.onViewport(viewport)} onNodeClick={() => onEdge(null)}
    onEdgeClick={(_, edge) => { onSelect([]); onEdge(edge.id); }} onPaneClick={() => { onSelect([]); onEdge(null); }}
    onDoubleClick={event => { if ((event.target as HTMLElement).classList.contains('react-flow__pane')) props.onAddNote({ x: event.clientX, y: event.clientY }); }}
    onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; }}
    onDrop={event => { event.preventDefault(); if (event.dataTransfer.files.length) props.onDropFiles(Array.from(event.dataTransfer.files), { x: event.clientX, y: event.clientY }); }}
    isValidConnection={connection => connection.source !== connection.target && !board.edges.some(edge => toCanvasId(edge.sourceId) === connection.source && toCanvasId(edge.targetId) === connection.target && edge.relation === 'evidences')}
    aria-label="Lienzo de investigación" defaultEdgeOptions={{ type: 'semantic' }}
  >
    <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#343640" />
    {props.minimap && <MiniMap<CanvasNode> position="bottom-right" nodeColor={node => minimapColors[node.data.entity.kind] ?? '#506976'} maskColor="rgba(15,17,22,.65)" pannable zoomable />}
  </ReactFlow>;
}
