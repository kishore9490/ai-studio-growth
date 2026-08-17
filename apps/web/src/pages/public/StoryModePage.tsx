import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';
import { PublicLayout } from '../../components/PublicLayout';
import { Badge, Button, Callout, Card, ProgressBar, cx } from '../../components/ui';
import { STORY_ACTORS, STORY_STEPS } from '../../data/story';
import { humanize } from '../../lib/format';

const STEP_MS = 5200;

/** "Play BID Network Story" (Section 42). */
export function StoryModePage() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const step = STORY_STEPS[index];

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      setIndex((current) => {
        if (current >= STORY_STEPS.length - 1) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, STEP_MS);
    return () => clearTimeout(timer);
  }, [playing, index]);

  const visibleActors = STORY_ACTORS.filter((actor) => step.actors.includes(actor.id));

  return (
    <PublicLayout>
      <div className="border-b border-slate-200 bg-navy-950">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <p className="text-2xs font-semibold uppercase tracking-widest text-brand-300">Network story</p>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-white">How one customer becomes a network</h1>
          <p className="mt-2 max-w-2xl text-sm text-navy-100">
            Ten steps from a single existing customer to a self-expanding network of verified organizations — the acquisition
            model, drawn.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                icon={playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                onClick={() => setPlaying((value) => !value)}
              >
                {playing ? 'Pause' : 'Play'}
              </Button>
              <Button
                icon={<ChevronLeft className="h-4 w-4" />}
                onClick={() => setIndex((value) => Math.max(0, value - 1))}
                disabled={index === 0}
              >
                Previous
              </Button>
              <Button
                icon={<ChevronRight className="h-4 w-4" />}
                onClick={() => setIndex((value) => Math.min(STORY_STEPS.length - 1, value + 1))}
                disabled={index === STORY_STEPS.length - 1}
              >
                Next
              </Button>
              <Button
                icon={<RotateCcw className="h-4 w-4" />}
                onClick={() => {
                  setIndex(0);
                  setPlaying(false);
                }}
              >
                Restart
              </Button>
            </div>
            <span className="text-xs text-slate-500">
              Step {index + 1} of {STORY_STEPS.length}
            </span>
          </div>
          <div className="mt-3">
            <ProgressBar value={((index + 1) / STORY_STEPS.length) * 100} tone="brand" />
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-5">
          <Card className="lg:col-span-3" padded={false}>
            <div className="relative h-[440px] overflow-hidden rounded-md bg-slate-50">
              <svg className="absolute inset-0 h-full w-full">
                <defs>
                  <marker id="story-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                    <path d="M0,0 L8,4 L0,8 z" fill="#94a3b8" />
                  </marker>
                </defs>
                {step.edges.map(([source, target, label]) => {
                  const from = STORY_ACTORS.find((actor) => actor.id === source);
                  const to = STORY_ACTORS.find((actor) => actor.id === target);
                  if (!from || !to) return null;
                  const x1 = 320 + from.x;
                  const y1 = 70 + from.y;
                  const x2 = 320 + to.x;
                  const y2 = 70 + to.y;
                  return (
                    <g key={`${source}-${target}`}>
                      <line
                        x1={x1}
                        y1={y1 + 26}
                        x2={x2}
                        y2={y2 - 26}
                        stroke={label.includes('verified') ? '#059669' : '#94a3b8'}
                        strokeWidth={1.5}
                        strokeDasharray={label === 'invites' ? '5 4' : undefined}
                        markerEnd="url(#story-arrow)"
                      />
                      <text
                        x={(x1 + x2) / 2 + 6}
                        y={(y1 + y2) / 2}
                        className="fill-slate-500"
                        style={{ fontSize: 10 }}
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}
              </svg>

              <AnimatePresence>
                {visibleActors.map((actor) => (
                  <motion.div
                    key={actor.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.35 }}
                    className={cx(
                      'absolute w-44 -translate-x-1/2 rounded-md border bg-white px-3 py-2 shadow-card',
                      step.highlight === actor.id ? 'border-brand-500 ring-2 ring-brand-200' : 'border-slate-200',
                    )}
                    style={{ left: 320 + actor.x, top: 70 + actor.y - 26 }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded text-2xs font-bold text-white"
                        style={{ backgroundColor: actor.color }}
                      >
                        {actor.label.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-navy-900">{actor.label}</p>
                        <p className="truncate font-mono text-[9px] text-slate-500">{actor.bidId}</p>
                      </div>
                    </div>
                    <div className="mt-1.5">
                      <Badge
                        tone={
                          step.states[actor.id] === 'CUSTOMER'
                            ? 'brand'
                            : step.states[actor.id] === 'VERIFIED_MEMBER'
                              ? 'verified'
                              : step.states[actor.id] === 'MEMBER'
                                ? 'info'
                                : 'pending'
                        }
                      >
                        {humanize(step.states[actor.id] ?? 'UNKNOWN')}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </Card>

          <div className="space-y-4 lg:col-span-2">
            <Card>
              <p className="bid-label">Step {index + 1}</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-navy-900">{step.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{step.narration}</p>
              {step.note && (
                <div className="mt-3">
                  <Callout tone="brand">{step.note}</Callout>
                </div>
              )}
            </Card>

            <Card>
              <p className="bid-label">Story steps</p>
              <ol className="mt-2 space-y-1">
                {STORY_STEPS.map((candidate, candidateIndex) => (
                  <li key={candidate.id}>
                    <button
                      onClick={() => setIndex(candidateIndex)}
                      className={cx(
                        'w-full rounded px-2 py-1 text-left text-xs transition',
                        candidateIndex === index ? 'bg-brand-50 font-medium text-brand-800' : 'text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      {candidateIndex + 1}. {candidate.title}
                    </button>
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
