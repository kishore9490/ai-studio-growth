import type { CareerItem } from '@/content';
import { cn } from '@/lib/cn';

/**
 * Visual summary of published appointment periods, including overlaps.
 * Decorative duplicate of the accessible list that follows it on the page.
 */
export function AppointmentChart({ entries, toYear }: { entries: CareerItem[]; toYear: number }) {
  const dated = entries.filter((e): e is CareerItem & { startYear: number } => e.startYear !== null);
  if (dated.length === 0) return null;
  const fromYear = Math.min(...dated.map((e) => e.startYear));
  const span = Math.max(1, toYear - fromYear);
  const pos = (year: number) => ((year - fromYear) / span) * 100;
  const ticks = [fromYear, ...Array.from({ length: 10 }, (_, i) => Math.ceil(fromYear / 5) * 5 + i * 5)].filter(
    (y, i, all) => y <= toYear && all.indexOf(y) === i && (y === fromYear || y - fromYear >= 2),
  );

  return (
    <div aria-hidden className="relative">
      <div className="relative ml-[clamp(10rem,28%,18rem)]">
        {ticks.map((year) => (
          <span key={year} className="absolute top-0 bottom-0 w-px bg-line-dark" style={{ left: `${pos(year)}%` }} />
        ))}
        <div className="relative space-y-4 py-2">
          {dated
            .slice()
            .sort((a, b) => a.startYear - b.startYear)
            .map((e) => {
              const open = e.end.kind === 'open';
              const end = e.end.kind === 'year' ? e.end.year : toYear;
              return (
                <div key={e.id} className="relative h-9">
                  <span className="absolute top-1/2 right-[calc(100%+1.25rem)] w-[clamp(9rem,40vw,17rem)] -translate-y-1/2 truncate text-right text-sm font-medium text-ink">
                    {e.role}
                  </span>
                  <span
                    className={cn('absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full', open ? 'bg-gradient-to-r from-navy to-navy/0' : 'bg-navy')}
                    style={{ left: `${pos(e.startYear)}%`, width: `${Math.max(pos(end) - pos(e.startYear), 1.5)}%` }}
                  />
                  <span className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-gold" style={{ left: `${pos(e.startYear)}%` }} />
                </div>
              );
            })}
        </div>
      </div>
      <div className="relative mt-3 ml-[clamp(10rem,28%,18rem)] h-5 text-xs text-ink-muted tabular-nums">
        {ticks.map((year) => (
          <span key={year} className="absolute -translate-x-1/2" style={{ left: `${pos(year)}%` }}>
            {year}
          </span>
        ))}
      </div>
    </div>
  );
}
