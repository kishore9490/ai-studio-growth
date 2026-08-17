import { useMemo, useState } from 'react';
import { Background, Controls, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { PublicLayout } from '../../components/PublicLayout';
import { Badge, Callout, Drawer, cx } from '../../components/ui';
import { ARCHITECTURE_VIEWS, type ArchNode } from '../../data/architecture';

const KIND_STYLE: Record<ArchNode['kind'], string> = {
  service: 'border-brand-300 bg-white',
  store: 'border-slate-300 bg-slate-50',
  external: 'border-amber-300 bg-amber-50',
  client: 'border-emerald-300 bg-emerald-50',
  concept: 'border-navy-300 bg-navy-50',
};

function ArchFlowNode({ data }: NodeProps) {
  const node = data as unknown as ArchNode;
  return (
    <div className={cx('w-52 rounded-md border px-3 py-2 shadow-card', KIND_STYLE[node.kind])}>
      <Handle type="target" position={Position.Top} />
      <p className="text-xs font-semibold text-navy-900">{node.label}</p>
      <p className="mt-0.5 line-clamp-3 text-[10px] leading-snug text-slate-600">{node.purpose}</p>
      <span className="mt-1.5 inline-block rounded bg-white/70 px-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
        {node.kind}
      </span>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

const nodeTypes = { arch: ArchFlowNode };

/** Interactive architecture explorer (Section 41). Every node opens a drawer. */
export function ArchitecturePage() {
  const [viewId, setViewId] = useState(ARCHITECTURE_VIEWS[0].id);
  const [selected, setSelected] = useState<ArchNode | null>(null);
  const view = ARCHITECTURE_VIEWS.find((candidate) => candidate.id === viewId) ?? ARCHITECTURE_VIEWS[0];

  const nodes = useMemo<Node[]>(
    () =>
      view.nodes.map((archNode) => ({
        id: archNode.id,
        type: 'arch',
        position: { x: archNode.x, y: archNode.y },
        data: { ...archNode } as unknown as Record<string, unknown>,
      })),
    [view],
  );

  const edges = useMemo<Edge[]>(
    () =>
      view.edges.map((edge, index) => ({
        id: `${edge.source}-${edge.target}-${index}`,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        style: { stroke: '#94a3b8' },
        labelStyle: { fontSize: 10, fill: '#475569' },
        labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9 },
      })),
    [view],
  );

  return (
    <PublicLayout>
      <div className="border-b border-slate-200 bg-navy-950">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <p className="text-2xs font-semibold uppercase tracking-widest text-brand-300">Architecture explorer</p>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-white">How BID Trust is put together</h1>
          <p className="mt-2 max-w-3xl text-sm text-navy-100">
            Twelve views over the same system. Click any node for its purpose, responsibilities, data, events, APIs, security
            posture and what it is designed to grow into.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="bid-scroll flex gap-1 overflow-x-auto border-b border-slate-200 pb-2">
          {ARCHITECTURE_VIEWS.map((candidate) => (
            <button
              key={candidate.id}
              onClick={() => setViewId(candidate.id)}
              className={cx(
                'whitespace-nowrap rounded px-3 py-1.5 text-sm transition',
                candidate.id === viewId ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              {candidate.title}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <h2 className="text-lg font-semibold tracking-tight text-navy-900">{view.title}</h2>
          <p className="mt-1 max-w-4xl text-sm text-slate-600">{view.description}</p>
        </div>

        <div className="mt-4 h-[560px] rounded-md border border-slate-200 bg-slate-50">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
            onNodeClick={(_, flowNode) => {
              const match = view.nodes.find((candidate) => candidate.id === flowNode.id);
              if (match) setSelected(match);
            }}
          >
            <Background gap={16} color="#e2e8f0" />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-2xs text-slate-500">
          {(['service', 'store', 'external', 'client', 'concept'] as ArchNode['kind'][]).map((kind) => (
            <span key={kind} className={cx('rounded border px-2 py-0.5', KIND_STYLE[kind])}>
              {kind}
            </span>
          ))}
          <span className="ml-auto">Tip: drag to pan, scroll to zoom, click a node for detail.</span>
        </div>

        <div className="mt-6">
          <Callout tone="neutral" title="This is the architecture of the code in this repository">
            The views describe the same services, stores and events that the running application uses — not an aspirational
            diagram. Where something is deliberately simplified for the demo (in-memory store, mock providers, in-process
            event bus), the node says so under “future”.
          </Callout>
        </div>
      </div>

      <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.label ?? ''} subtitle={selected?.kind}>
        {selected && (
          <div className="space-y-4 text-sm">
            <div>
              <p className="bid-label">Purpose</p>
              <p className="mt-1 text-slate-700">{selected.purpose}</p>
            </div>
            <DetailList title="Responsibilities" items={selected.responsibilities} />
            <DetailList title="Inputs" items={selected.inputs} />
            <DetailList title="Outputs" items={selected.outputs} />
            <DetailList title="Dependencies" items={selected.dependencies} />
            <DetailList title="Data" items={selected.data} mono />
            <DetailList title="Events" items={selected.events} mono />
            <DetailList title="APIs" items={selected.apis} mono />
            <DetailList title="Security" items={selected.security} />
            <DetailList title="Designed to grow into" items={selected.future} />
          </div>
        )}
      </Drawer>
    </PublicLayout>
  );
}

function DetailList({ title, items, mono }: { title: string; items: string[]; mono?: boolean }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="bid-label">{title}</p>
      <ul className="mt-1.5 space-y-1">
        {items.map((item) => (
          <li key={item}>
            {mono ? (
              <Badge tone="neutral" className="font-mono normal-case tracking-normal">
                {item}
              </Badge>
            ) : (
              <span className="flex gap-1.5 text-xs text-slate-700">
                <span className="text-slate-400">·</span>
                {item}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
