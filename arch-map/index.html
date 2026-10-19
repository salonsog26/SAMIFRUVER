import { MarkerType } from '@xyflow/react';
import { EDGE_KINDS } from './theme';

export const NODE_WIDTH = 220;
const LANE_PADDING_X = 40;

/** Convierte architecture.json en nodos de React Flow (lanes de fondo + módulos). */
export function buildInitialNodes(architecture) {
  const xs = architecture.nodes.map((n) => n.position.x);
  const minX = Math.min(...xs) - LANE_PADDING_X - 20;
  const maxX = Math.max(...xs) + NODE_WIDTH + LANE_PADDING_X;

  const laneNodes = architecture.lanes.map((lane) => ({
    id: lane.id,
    type: 'lane',
    position: { x: minX, y: lane.y },
    data: { label: lane.label, color: lane.color },
    width: maxX - minX,
    height: lane.height,
    style: { pointerEvents: 'none' },
    draggable: false,
    selectable: false,
    focusable: false,
    zIndex: -1,
  }));

  const moduleNodes = architecture.nodes.map((node) => ({
    id: node.id,
    type: 'module',
    position: node.position,
    data: node,
  }));

  return [...laneNodes, ...moduleNodes];
}

/**
 * Elige los lados de conexión según la posición actual de los nodos,
 * para que las flechas se vean bien incluso después de arrastrarlos.
 */
function pickHandles(source, target) {
  const dx = target.position.x - source.position.x;
  const dy = target.position.y - source.position.y;

  if (Math.abs(dy) < 60) {
    return dx >= 0
      ? { sourceHandle: 's-right', targetHandle: 't-left' }
      : { sourceHandle: 's-left', targetHandle: 't-right' };
  }
  return dy > 0
    ? { sourceHandle: 's-bottom', targetHandle: 't-top' }
    : { sourceHandle: 's-top', targetHandle: 't-bottom' };
}

/** Construye los edges para la vista y selección actuales. */
export function buildEdges({ architecture, nodes, mode, selectedId }) {
  const byId = new Map(nodes.map((n) => [n.id, n]));

  return architecture.edges.map((edge) => {
    const kind = EDGE_KINDS[edge.kind] ?? EDGE_KINDS.dependencia;
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    const handles = source && target ? pickHandles(source, target) : {};

    const touchesSelection = selectedId && (edge.source === selectedId || edge.target === selectedId);
    const dimmed = selectedId && !touchesSelection;

    // Etiquetas: el flujo de negocio siempre; el resto solo al seleccionar un nodo conectado.
    const showLabel = edge.kind === 'flujo' || touchesSelection;
    const text = mode === 'technical' ? edge.techLabel ?? edge.label : edge.label;

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      ...handles,
      type: 'smoothstep',
      pathOptions: { borderRadius: 14 },
      animated: kind.animated && !dimmed,
      label: showLabel ? text : undefined,
      labelStyle: { fontSize: 11, fontWeight: 500, fill: '#44403c' },
      labelBgPadding: [6, 3],
      labelBgBorderRadius: 6,
      style: {
        stroke: kind.color,
        strokeWidth: touchesSelection ? kind.width + 1 : kind.width,
        strokeDasharray: kind.dashed ? '6 4' : undefined,
        opacity: dimmed ? 0.15 : 1,
        transition: 'opacity 150ms',
      },
      markerEnd: { type: MarkerType.ArrowClosed, color: kind.color, width: 16, height: 16 },
      zIndex: touchesSelection ? 1 : 0,
      data: { kind: edge.kind },
    };
  });
}

/** Vecinos directos de un nodo (entrantes y salientes). */
export function getConnections(architecture, nodeId) {
  const incoming = architecture.edges.filter((e) => e.target === nodeId);
  const outgoing = architecture.edges.filter((e) => e.source === nodeId);
  return { incoming, outgoing };
}
