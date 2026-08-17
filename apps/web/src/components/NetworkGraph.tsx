import { useMemo } from 'react';
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { GraphEdge, GraphNode } from '@bid/core';
import { layeredLayout } from '../lib/graph-layout';
import { cx } from './ui';

export interface NetworkGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onSelectNode?: (node: GraphNode) => void;
  onSelectEdge?: (edge: GraphEdge) => void;
  height?: number | string;
}

type EntityNodeData = GraphNode & { onSelect?: (node: GraphNode) => void };

function EntityNode({ data }: NodeProps) {
  const node = data as unknown as EntityNodeData;
  return (
    <div
      className={cx(
        'w-48 rounded-md border bg-white px-3 py-2 shadow-card transition',
        node.isCustomer ? 'border-brand-400' : node.verified ? 'border-emerald-300' : 'border-slate-300',
      )}
    >
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-2xs font-bold text-white"
          style={{ backgroundColor: node.color }}
        >
          {node.kind === 'PERSON' ? 'P' : node.label.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-navy-900">{node.label}</p>
          <p className="truncate font-mono text-[9px] text-slate-500">{node.bidId}</p>
        </div>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {node.verified && <span className="rounded bg-emerald-50 px-1 text-[9px] font-semibold text-emerald-700">VERIFIED</span>}
        {node.isCustomer && <span className="rounded bg-brand-50 px-1 text-[9px] font-semibold text-brand-700">CUSTOMER</span>}
        {node.monitored && <span className="rounded bg-sky-50 px-1 text-[9px] font-semibold text-sky-700">MONITORED</span>}
        {node.kind === 'PERSON' && <span className="rounded bg-slate-100 px-1 text-[9px] font-semibold text-slate-600">PERSON</span>}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

const nodeTypes = { entity: EntityNode };

export function NetworkGraph({ nodes, edges, onSelectNode, onSelectEdge, height = 560 }: NetworkGraphProps) {
  const positions = useMemo(() => layeredLayout({ nodes, edges }), [nodes, edges]);

  const flowNodes = useMemo<Node[]>(
    () =>
      nodes.map((node) => ({
        id: node.id,
        type: 'entity',
        position: positions[node.id] ?? { x: 0, y: 0 },
        data: { ...node } as unknown as Record<string, unknown>,
      })),
    [nodes, positions],
  );

  const flowEdges = useMemo<Edge[]>(
    () =>
      edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        animated: edge.lifecycle === 'VERIFICATION' || edge.verificationStatus === 'CHECKS_RUNNING',
        style: {
          stroke:
            edge.lifecycle === 'ACTIVE' || edge.lifecycle === 'MONITORED'
              ? '#059669'
              : edge.lifecycle === 'SUSPENDED' || edge.lifecycle === 'TERMINATED'
                ? '#dc2626'
                : '#94a3b8',
          strokeDasharray: edge.monitored ? undefined : '4 3',
        },
        labelStyle: { fontSize: 10, fill: '#475569' },
        labelBgStyle: { fill: '#ffffff', fillOpacity: 0.85 },
      })),
    [edges],
  );

  return (
    <div style={{ height }} className="rounded-md border border-slate-200 bg-slate-50">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={1.6}
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_, node) => {
          const match = nodes.find((candidate) => candidate.id === node.id);
          if (match) onSelectNode?.(match);
        }}
        onEdgeClick={(_, edge) => {
          const match = edges.find((candidate) => candidate.id === edge.id);
          if (match) onSelectEdge?.(match);
        }}
      >
        <Background gap={16} color="#e2e8f0" />
        {/*
          Controls give zoom, pan and fit-to-screen. A minimap is deliberately
          omitted: at this graph size the whole network is already in view, and
          the one XYFlow renders for these custom nodes paints no node
          rectangles — an empty white box is worse than no box at all.
        */}
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
