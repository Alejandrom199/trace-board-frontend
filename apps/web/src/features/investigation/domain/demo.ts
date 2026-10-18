import { investigationSchema, type Investigation, type Workspace, type Entity, type Relation } from './model';
const now = '2026-10-13T14:00:00.000Z';
function card(id: string, kind: Entity['kind'], title: string, description: string, extra: Partial<Entity> = {}): Entity {
  return { id, kind, title, description, createdAt: now, updatedAt: now, ...extra };
}
function edge(id: string, sourceId: string, targetId: string, relation: Relation['relation']): Relation {
  return { id, sourceId, targetId, relation, description: '', createdAt: now, metadata: {} };
}
export function demoInvestigation(): Investigation {
  return investigationSchema.parse({
    id: 'inventory', name: 'Sistema de Inventario', description: 'Investigación del control de existencias y movimientos de Bodega Central.', createdAt: now, updatedAt: now, viewport: { x: 35, y: 45, zoom: .75 },
    entities: [
      card('interview', 'document', 'Entrevista con el encargado de bodega', '“A veces el sistema dice que tenemos stock, pero al buscar en la bodega ya no hay. No sabemos quién hizo el último movimiento.”', { assetId: 'interview-file' }),
      card('spreadsheet', 'document', 'Movimientos de inventario', 'Se encontraron movimientos duplicados y ajustes manuales sin un responsable registrado.', { assetId: 'spreadsheet-file' }),
      card('screenshot', 'image', 'El sistema actual', 'La pantalla de existencias no permite consultar el historial de movimientos.', { assetId: 'screenshot-file' }),
      card('finding-trace', 'finding', 'No hay trazabilidad de movimientos', 'Los ingresos, salidas y ajustes no conservan un historial verificable. Es imposible reconstruir quién modificó una existencia.'),
      card('finding-stock', 'finding', 'El stock físico no coincide', 'Los registros duplicados y las salidas sin registrar generan diferencias entre bodega y sistema.'),
      card('req-trace', 'requirement', 'Registrar cada movimiento de inventario', 'El sistema debe registrar fecha, usuario, producto, cantidad y tipo en cada ingreso, salida o ajuste.', { requirement: { code: 'RF-001', priority: 'high', status: 'review', criteria: ['Cada movimiento conserva fecha, usuario, producto, cantidad y tipo.', 'El historial se puede consultar por producto y fecha.', 'Los movimientos registrados no se eliminan sin una auditoría.'] } }),
      card('req-stock', 'requirement', 'Validar existencias antes de una salida', 'Comprobar disponibilidad y actualizar la existencia al registrar una salida, evitando stock negativo.', { requirement: { code: 'RF-002', priority: 'critical', status: 'draft', criteria: ['Una salida no puede superar el stock disponible.', 'El stock se actualiza al confirmar el movimiento.'] } }),
      card('note', 'note', 'Para la próxima entrevista', '¿Quién autoriza los ajustes?\n¿Cómo se gestionan las devoluciones?\n¿Se cuentan las existencias periódicamente?'),
    ],
    assets: [
      { id: 'interview-file', name: 'entrevista_bodega.pdf', mime: 'application/pdf', size: 284000 },
      { id: 'spreadsheet-file', name: 'inventario_octubre.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 96000 },
      { id: 'screenshot-file', name: 'sistema_actual.png', mime: 'image/svg+xml', size: 12400, url: '/demo/inventory.svg' },
    ],
    elements: [
      { nodeId: 'interview', x: 70, y: 80 }, { nodeId: 'spreadsheet', x: 70, y: 370 }, { nodeId: 'screenshot', x: 70, y: 640 },
      { nodeId: 'finding-trace', x: 580, y: 130 }, { nodeId: 'finding-stock', x: 580, y: 520 },
      { nodeId: 'req-trace', x: 1080, y: 90 }, { nodeId: 'req-stock', x: 1080, y: 480 }, { nodeId: 'note', x: 1080, y: 800 },
    ],
    edges: [edge('e1', 'interview', 'finding-trace', 'evidences'), edge('e2', 'spreadsheet', 'finding-trace', 'evidences'), edge('e3', 'spreadsheet', 'finding-stock', 'evidences'), edge('e4', 'screenshot', 'finding-stock', 'evidences'), edge('e5', 'finding-trace', 'req-trace', 'originates'), edge('e6', 'finding-stock', 'req-stock', 'originates'), edge('e7', 'req-stock', 'req-trace', 'depends_on')],
  });
}
export function demoWorkspace(): Workspace { return { version: 1, activeId: 'inventory', investigations: [demoInvestigation()] }; }
