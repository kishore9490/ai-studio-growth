import type { CSSProperties } from 'react';

type Priority = { id: string; number: number; title: string };

/**
 * Concept diagram: a central idea connected to the seven stated priorities.
 * The nodes are real in-page links, so the diagram doubles as navigation.
 * On small screens it becomes a numbered list.
 */
export function VisionDiagram({ center, label, priorities }: { center: string; label: string; priorities: Priority[] }) {
  const radius = 40; // percent of the container
  const points = priorities.map((p, i) => {
    const angle = (-90 + (360 / priorities.length) * i) * (Math.PI / 180);
    return { ...p, x: 50 + radius * Math.cos(angle), y: 50 + radius * Math.sin(angle) };
  });

  return (
    <nav aria-label={label} className="relative mx-auto w-full max-w-5xl lg:aspect-square lg:max-h-[52rem]">
      <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 hidden h-full w-full lg:block">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="white" strokeOpacity="0.1" strokeWidth="0.15" />
        <circle cx="50" cy="50" r="27" fill="none" stroke="white" strokeOpacity="0.08" strokeWidth="0.15" strokeDasharray="0.4 1.2" />
        {points.map((p) => (
          <line key={p.id} x1="50" y1="50" x2={p.x} y2={p.y} stroke="var(--color-gold)" strokeOpacity="0.35" strokeWidth="0.15" />
        ))}
        <circle cx="50" cy="50" r="13" fill="rgb(49 95 234 / 0.15)" stroke="var(--color-royal-soft)" strokeOpacity="0.5" strokeWidth="0.2" />
      </svg>

      <p
        aria-hidden
        className="mx-auto mb-8 max-w-[12rem] text-center font-serif text-xl leading-snug text-ivory lg:absolute lg:top-1/2 lg:left-1/2 lg:mb-0 lg:-translate-x-1/2 lg:-translate-y-1/2"
      >
        {center}
      </p>

      <ol className="grid gap-3 sm:grid-cols-2 lg:block">
        {points.map((p) => (
          <li
            key={p.id}
            className="lg:absolute lg:top-[var(--y)] lg:left-[var(--x)] lg:w-52 lg:-translate-x-1/2 lg:-translate-y-1/2"
            style={{ '--x': `${p.x}%`, '--y': `${p.y}%` } as CSSProperties}
          >
            <a
              href={`#${p.id}`}
              className="group flex items-center gap-3 rounded-2xl border border-line bg-navy-raised px-4 py-3 text-left transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-gold/60"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/50 font-display text-xs font-semibold text-gold tabular-nums">
                {String(p.number).padStart(2, '0')}
              </span>
              <span className="text-sm leading-snug font-medium text-white">{p.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
