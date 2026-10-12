import type { Visual } from '../../content/services'

/**
 * Service visuals. Product-centric services use stills rendered from the same 3D scene as the hero;
 * the others use technical line illustrations in a shared style (1.25px strokes, signal-red accents).
 */

const S = { stroke: 'currentColor', strokeWidth: 1.25, fill: 'none', vectorEffect: 'non-scaling-stroke' as const }
const RED = '#F04438'
const LIME = '#C7F36B'

export function ServiceVisual({ visual, className = '', priority = false }: { visual: Visual; className?: string; priority?: boolean }) {
  if (visual === 'product' || visual === 'gauge') {
    const src = visual === 'product' ? '/images/render-product' : '/images/render-detail'
    return (
      <picture className={className}>
        <source srcSet={`${src}-800.webp 800w, ${src}-1400.webp 1400w`} sizes="(min-width: 1024px) 50vw, 100vw" type="image/webp" />
        <img
          src={`${src}-1400.webp`}
          alt={visual === 'product' ? 'Rendered red ABC dry powder fire extinguisher in a dark industrial space' : 'Close-up render of an extinguisher valve head, pressure gauge and pull pin'}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          width={1400}
          height={1000}
          className="h-full w-full object-cover"
        />
      </picture>
    )
  }
  return (
    <svg viewBox="0 0 400 300" className={`text-tech/70 ${className}`} role="img" aria-label={LABELS[visual]}>
      <defs>
        <pattern id={`g-${visual}`} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" stroke="currentColor" strokeOpacity="0.08" fill="none" />
        </pattern>
      </defs>
      <rect width="400" height="300" fill={`url(#g-${visual})`} />
      {visual === 'calendar' && <Calendar />}
      {visual === 'systems' && <Systems />}
      {visual === 'audit' && <Audit />}
      {visual === 'training' && <Training />}
    </svg>
  )
}

const LABELS: Record<Visual, string> = {
  product: '',
  gauge: '',
  calendar: 'Illustration: a maintenance calendar with scheduled service visits',
  systems: 'Illustration: a ceiling with a smoke detector, sprinkler head and alarm sounder',
  audit: 'Illustration: a floor plan with an inspection checklist',
  training: 'Illustration: the PASS technique — pull, aim, squeeze, sweep',
}

function Calendar() {
  const visits = new Set([2, 9, 15, 21])
  return (
    <g>
      <rect x="70" y="50" width="260" height="200" {...S} />
      <path d="M70 86H330" {...S} />
      {[110, 170, 230, 290].map((x) => (
        <path key={x} d={`M${x} 40V60`} {...S} strokeWidth={2} />
      ))}
      {Array.from({ length: 24 }).map((_, i) => {
        const x = 82 + (i % 6) * 41
        const y = 98 + Math.floor(i / 6) * 37
        const on = visits.has(i)
        return (
          <g key={i}>
            <rect x={x} y={y} width="33" height="29" {...S} strokeOpacity={on ? 1 : 0.35} stroke={on ? RED : 'currentColor'} />
            {on && <circle cx={x + 16.5} cy={y + 14.5} r="5" fill={RED} />}
          </g>
        )
      })}
      <text x="78" y="74" className="meta" fill="currentColor" fontSize="10">
        AMC · SCHEDULED VISITS
      </text>
      <circle cx="318" cy="70" r="5" fill={LIME} />
    </g>
  )
}

function Systems() {
  return (
    <g>
      <path d="M20 70H380" {...S} strokeWidth={2} />
      <path d="M20 90H380" {...S} stroke={RED} strokeOpacity={0.85} />
      {/* smoke detector */}
      <g transform="translate(90 70)">
        <path d="M-26 0a26 12 0 0 0 52 0" {...S} />
        <circle cx="0" cy="8" r="3" fill={LIME} />
        <g className="animate-pulse">
          <path d="M-40 26q40 18 80 0M-56 44q56 26 112 0" {...S} strokeOpacity={0.4} />
        </g>
      </g>
      {/* sprinkler */}
      <g transform="translate(205 90)">
        <path d="M0 0V22M-8 22H8M-14 34H14M0 22V34" {...S} stroke={RED} />
        <path d="M-6 30l-30 70M6 30l30 70M0 34V110M-3 32l-60 50M3 32l60 50" {...S} strokeOpacity={0.35} strokeDasharray="2 6" />
      </g>
      {/* sounder */}
      <g transform="translate(320 70)">
        <rect x="-20" y="0" width="40" height="30" {...S} />
        <circle cx="0" cy="15" r="7" fill={RED} />
        <path d="M28 6q8 9 0 18M36 0q14 15 0 30" {...S} strokeOpacity={0.5} />
      </g>
      <path d="M20 250H380" {...S} />
      <text x="20" y="276" fill="currentColor" fontSize="10" className="meta">
        DETECT · ALERT · SUPPRESS — ILLUSTRATIVE
      </text>
    </g>
  )
}

function Audit() {
  return (
    <g>
      <path d="M40 60H250V240H40Z M40 150H140V240 M140 60V120 M190 150H250 M190 150V200" {...S} />
      <path d="M140 120V135 M190 200V215" {...S} strokeOpacity={0.3} />
      {/* exit route */}
      <path d="M95 200V170H165V95H245" {...S} stroke={LIME} strokeDasharray="5 5" />
      <path d="M238 88l9 7-9 7" {...S} stroke={LIME} />
      {/* extinguisher markers */}
      {[
        [60, 80],
        [230, 180],
        [120, 225],
      ].map(([x, y], i) => (
        <rect key={i} x={x - 5} y={y - 5} width="10" height="10" fill={RED} />
      ))}
      {/* checklist */}
      <g transform="translate(272 70)">
        <rect width="100" height="150" {...S} />
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i} transform={`translate(12 ${20 + i * 26})`}>
            <rect width="12" height="12" {...S} stroke={i < 3 ? LIME : 'currentColor'} />
            {i < 3 && <path d="M2 6l3 3 5-6" {...S} stroke={LIME} />}
            <path d="M22 6H76" {...S} strokeOpacity={0.4} />
          </g>
        ))}
      </g>
    </g>
  )
}

function Training() {
  const steps = ['PULL', 'AIM', 'SQUEEZE', 'SWEEP']
  return (
    <g>
      {steps.map((s, i) => (
        <g key={s} transform={`translate(${30 + i * 88} 60)`}>
          <rect width="76" height="150" {...S} strokeOpacity={0.5} />
          <text x="8" y="18" fill={RED} fontSize="11" className="meta">
            0{i + 1}
          </text>
          {/* mini extinguisher */}
          <rect x="26" y="60" width="22" height="64" rx="10" {...S} />
          <path d="M31 60V50H44V60 M44 52H58" {...S} />
          {i === 0 && <circle cx="24" cy="50" r="7" {...S} stroke={LIME} />}
          {i === 1 && <path d="M58 52Q70 70 66 100" {...S} stroke={LIME} />}
          {i === 2 && <path d="M30 44L56 40" {...S} stroke={LIME} strokeWidth={2} />}
          {i === 3 && <path d="M50 138Q38 146 26 138 M50 138l-3-5 M26 138l3-5" {...S} stroke={LIME} />}
          <text x="8" y="143" fill="currentColor" fontSize="10" className="meta">
            {s}
          </text>
        </g>
      ))}
      <text x="30" y="246" fill="currentColor" fontSize="10" className="meta">
        THE PASS TECHNIQUE
      </text>
    </g>
  )
}
