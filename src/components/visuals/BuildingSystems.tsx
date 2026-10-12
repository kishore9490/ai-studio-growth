import { useEffect, useRef, useState } from 'react'

type Layer = 'detection' | 'alarm' | 'sprinklers' | 'extinguishers' | 'zones'

const LAYERS: { id: Layer; label: string; color: string; note: string }[] = [
  { id: 'detection', label: 'Detectors', color: '#F5F6F7', note: 'Smoke and heat detectors on each floor sense a fire early.' },
  { id: 'alarm', label: 'Alarm & panel', color: '#F04438', note: 'The control panel identifies the source and sounds alarms throughout the building.' },
  { id: 'sprinklers', label: 'Sprinklers', color: '#F04438', note: 'Heads operate individually when heat reaches their rating, fed from the riser.' },
  { id: 'extinguishers', label: 'Extinguishers', color: '#F04438', note: 'Portable units placed along escape routes and beside specific hazards.' },
  { id: 'zones', label: 'Protected zones', color: '#C7F36B', note: 'Conceptual coverage areas used to plan detection and equipment.' },
]

const FLOORS = [400, 240, 80] // ceiling y of each storey (ground, first, second)
const FLOOR_H = 160
const DET_X = [170, 290, 470, 590, 730]
const HEAD_X = [150, 230, 310, 410, 490, 570, 670, 750]

export function BuildingSystems() {
  const ref = useRef<HTMLDivElement>(null)
  const [live, setLive] = useState(false)
  const [on, setOn] = useState<Record<Layer, boolean>>({ detection: true, alarm: true, sprinklers: true, extinguishers: true, zones: true })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setLive(true)
      return
    }
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setLive(true), { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const vis = (l: Layer) => ({ opacity: on[l] ? 1 : 0, transition: 'opacity .5s' })

  return (
    <div ref={ref} className={live ? 'bs-live' : ''}>
      <style>{`
        .bs-draw { stroke-dasharray: 1400; stroke-dashoffset: 1400; }
        .bs-live .bs-draw { animation: bs-draw 2.4s cubic-bezier(.22,1,.36,1) forwards; }
        .bs-live .bs-draw.d2 { animation-delay: .4s } .bs-live .bs-draw.d3 { animation-delay: .8s }
        @keyframes bs-draw { to { stroke-dashoffset: 0; } }
        .bs-signal { stroke-dasharray: 10 14; }
        .bs-live .bs-signal { animation: bs-flow 1.6s linear infinite; }
        @keyframes bs-flow { to { stroke-dashoffset: -48; } }
        .bs-ping { transform-box: fill-box; transform-origin: center; opacity: 0; }
        .bs-live .bs-ping { animation: bs-ping 3s ease-out infinite; }
        @keyframes bs-ping { 0% { transform: scale(.4); opacity: .9 } 70%,100% { transform: scale(2.4); opacity: 0 } }
        .bs-blink { opacity: .35 }
        .bs-live .bs-blink { animation: bs-blink 1.2s steps(2) infinite; animation-delay: 1.8s }
        @keyframes bs-blink { 50% { opacity: 1 } }
      `}</style>
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Show or hide system layers">
        {LAYERS.map((l) => (
          <button
            key={l.id}
            type="button"
            aria-pressed={on[l.id]}
            onClick={() => setOn((s) => ({ ...s, [l.id]: !s[l.id] }))}
            className="meta flex min-h-10 items-center gap-2 border border-tech/15 px-3 text-tech/60 transition-colors aria-pressed:border-tech/40 aria-pressed:text-tech"
          >
            <span className="h-2 w-2 rounded-full" style={{ background: on[l.id] ? l.color : 'transparent', border: `1px solid ${l.color}` }} />
            {l.label}
          </button>
        ))}
      </div>

      <figure className="relative">
        <div className="overflow-x-auto">
          <svg viewBox="0 0 1000 620" className="min-w-[640px] text-tech" role="img" aria-labelledby="bs-title bs-desc">
            <title id="bs-title">Illustrative fire protection layout of a three-storey commercial building</title>
            <desc id="bs-desc">
              Cross-section showing smoke detectors on every floor connected to a fire alarm panel on the ground floor, alarm sounders by the stair, a
              sprinkler riser feeding pipework and heads on each ceiling, portable extinguishers along escape routes, and protected zones. Conceptual only.
            </desc>
            {/* ground + structure */}
            <path d="M40 560H960" stroke="currentColor" strokeOpacity=".5" />
            {[80, 240, 400].map((y) => (
              <rect key={y} x="90" y={y - 6} width="820" height="6" fill="currentColor" opacity=".18" />
            ))}
            <path d="M90 74V560M910 74V560" stroke="currentColor" strokeOpacity=".4" strokeWidth="2" />
            {/* partitions with door gaps */}
            {FLOORS.map((y) => (
              <g key={y} stroke="currentColor" strokeOpacity=".22">
                <path d={`M380 ${y}V${y + 110}M640 ${y}V${y + 110}`} />
                <path d={`M380 ${y + 145}V${y + FLOOR_H}M640 ${y + 145}V${y + FLOOR_H}`} />
              </g>
            ))}
            {/* escape stair */}
            <g stroke="currentColor" strokeOpacity=".3" fill="none">
              <path d="M800 74V560" />
              {FLOORS.map((y) => (
                <path key={y} d={`M812 ${y + FLOOR_H - 4}l14 -12h14l14 -12h14l14 -12h14l14 -12`} />
              ))}
            </g>
            <text x="815" y="58" className="meta" fontSize="11" fill="currentColor" opacity=".5">
              ESCAPE STAIR
            </text>

            {/* zones */}
            <g style={vis('zones')}>
              {FLOORS.map((y, i) => (
                <g key={y}>
                  <rect x="100" y={y + 4} width="270" height={FLOOR_H - 14} fill="#C7F36B" opacity=".045" stroke="#C7F36B" strokeOpacity=".35" strokeDasharray="4 6" />
                  <rect x="390" y={y + 4} width="240" height={FLOOR_H - 14} fill="#C7F36B" opacity=".045" stroke="#C7F36B" strokeOpacity=".35" strokeDasharray="4 6" />
                  <rect x="650" y={y + 4} width="140" height={FLOOR_H - 14} fill="#C7F36B" opacity=".045" stroke="#C7F36B" strokeOpacity=".35" strokeDasharray="4 6" />
                  <text x="108" y={y + FLOOR_H - 18} fontSize="10" fill="#C7F36B" opacity=".7" className="meta">
                    ZONE {i + 1}A
                  </text>
                </g>
              ))}
            </g>

            {/* sprinklers */}
            <g style={vis('sprinklers')} stroke="#F04438" fill="none">
              <path className="bs-draw" d="M870 590V100" strokeWidth="4" />
              {FLOORS.map((y, i) => (
                <g key={y}>
                  <path className={`bs-draw d${i + 1}`} d={`M870 ${y + 22}H130`} strokeWidth="2" />
                  {HEAD_X.map((x) => (
                    <g key={x}>
                      <path d={`M${x} ${y + 22}v10m-7 0h14`} strokeWidth="1.5" />
                    </g>
                  ))}
                </g>
              ))}
              <rect x="856" y="520" width="28" height="30" fill="#0B0E12" strokeWidth="1.5" />
              <text x="740" y="610" fontSize="10" fill="#F04438" stroke="none" className="meta">
                RISER · CONTROL VALVE
              </text>
            </g>

            {/* detection */}
            <g style={vis('detection')}>
              {FLOORS.map((y) =>
                DET_X.map((x, j) => (
                  <g key={`${x}${y}`}>
                    <path d={`M${x - 11} ${y}a11 7 0 0 0 22 0`} fill="#F5F6F7" opacity=".9" />
                    {j === 2 && y === 240 && <circle className="bs-ping" cx={x} cy={y + 6} r="10" fill="none" stroke="#F5F6F7" />}
                  </g>
                )),
              )}
            </g>

            {/* alarm: panel, signal path, sounders */}
            <g style={vis('alarm')}>
              <path className="bs-signal" d="M470 246V262H780V470H812" fill="none" stroke="#F04438" strokeWidth="1.5" />
              <rect x="812" y="452" width="56" height="40" fill="#0B0E12" stroke="#F04438" />
              <text x="818" y="476" fontSize="10" fill="#F5F6F7" className="meta">
                FACP
              </text>
              {FLOORS.map((y) => (
                <g key={y} transform={`translate(780 ${y + 40})`}>
                  <rect x="-10" y="-9" width="20" height="18" fill="#0B0E12" stroke="#F04438" />
                  <circle className="bs-blink" r="4" fill="#F04438" />
                </g>
              ))}
            </g>

            {/* extinguishers */}
            <g style={vis('extinguishers')}>
              {FLOORS.flatMap((y) =>
                [360, 620, 790].map((x) => (
                  <g key={`${x}${y}`} transform={`translate(${x} ${y + FLOOR_H - 34})`}>
                    <rect width="9" height="22" rx="4" fill="#F04438" />
                    <rect x="-2" y="-12" width="13" height="4" fill="#F5F6F7" opacity=".8" />
                  </g>
                )),
              )}
            </g>
          </svg>
        </div>
        <figcaption className="mt-5 grid gap-x-8 gap-y-3 text-sm text-tech/65 sm:grid-cols-2 lg:grid-cols-3">
          {LAYERS.filter((l) => on[l.id]).map((l) => (
            <p key={l.id}>
              <span className="font-semibold text-tech">{l.label}.</span> {l.note}
            </p>
          ))}
        </figcaption>
        <p className="meta mt-6 text-muted">Illustrative marketing visualisation — not a design drawing, compliance assessment or monitoring system.</p>
      </figure>
    </div>
  )
}
