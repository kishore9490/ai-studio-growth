export interface LayoutInput {
  nodes: { id: string }[];
  edges: { source: string; target: string }[];
}

export type Positions = Record<string, { x: number; y: number }>;

/**
 * Deterministic layered layout.
 *
 * Roots (nodes nobody points at) sit on the top layer; every other node sits one
 * layer below its earliest parent. Deterministic output keeps the graph stable
 * across re-renders, which matters when the store mutates while you are looking
 * at it.
 */
export function layeredLayout(
  input: LayoutInput,
  options: { xGap?: number; yGap?: number; originX?: number; originY?: number } = {},
): Positions {
  const xGap = options.xGap ?? 230;
  const yGap = options.yGap ?? 150;
  const originX = options.originX ?? 0;
  const originY = options.originY ?? 0;

  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();
  for (const node of input.nodes) {
    incoming.set(node.id, []);
    outgoing.set(node.id, []);
  }
  for (const edge of input.edges) {
    if (!incoming.has(edge.target) || !outgoing.has(edge.source)) continue;
    incoming.get(edge.target)!.push(edge.source);
    outgoing.get(edge.source)!.push(edge.target);
  }

  const depth = new Map<string, number>();
  const roots = input.nodes.filter((node) => (incoming.get(node.id)?.length ?? 0) === 0).map((node) => node.id);
  const queue: string[] = [...roots];
  for (const id of roots) depth.set(id, 0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDepth = depth.get(current) ?? 0;
    for (const child of outgoing.get(current) ?? []) {
      if (depth.has(child)) continue;
      depth.set(child, currentDepth + 1);
      queue.push(child);
    }
  }

  // Nodes in a cycle or otherwise unreached go one level below the deepest.
  const maxDepth = Math.max(0, ...[...depth.values()]);
  for (const node of input.nodes) {
    if (!depth.has(node.id)) depth.set(node.id, maxDepth + 1);
  }

  const byDepth = new Map<number, string[]>();
  for (const node of input.nodes) {
    const level = depth.get(node.id) ?? 0;
    byDepth.set(level, [...(byDepth.get(level) ?? []), node.id]);
  }

  const positions: Positions = {};
  for (const [level, ids] of [...byDepth.entries()].sort((a, b) => a[0] - b[0])) {
    const width = (ids.length - 1) * xGap;
    ids.forEach((id, index) => {
      positions[id] = { x: originX + index * xGap - width / 2, y: originY + level * yGap };
    });
  }
  return positions;
}
