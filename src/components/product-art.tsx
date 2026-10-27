import { cn } from "@/lib/utils";

// Vector thumbnails for digital products. Each `artwork` key renders a small,
// deliberate illustration of what the product actually contains, tinted by
// the product's hue. No external images, nothing to break.

type P = { a: string; soft: string; mid: string; deep: string; paper: string; line: string };

function palette(h: number): P {
  return {
    a: `hsl(${h} 72% 62%)`,
    soft: `hsl(${h} 70% 93%)`,
    mid: `hsl(${h} 55% 82%)`,
    deep: `hsl(${h} 38% 26%)`,
    paper: "#ffffff",
    line: "#e6e2da",
  };
}

const Sheet = ({ x, y, w, h, r = 10 }: { x: number; y: number; w: number; h: number; r?: number }) => (
  <rect x={x} y={y} width={w} height={h} rx={r} fill="#fff" stroke="#e6e2da" />
);

const Bar = ({ x, y, w, h = 7, fill = "#e9e6df", r = 3.5 }: { x: number; y: number; w: number; h?: number; fill?: string; r?: number }) => (
  <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} />
);

const art: Record<string, (p: P) => React.ReactNode> = {
  resume: (p) => (
    <>
      <g transform="rotate(-4 200 160)">
        <Sheet x={128} y={40} w={150} h={210} />
      </g>
      <Sheet x={118} y={34} w={164} h={226} />
      <circle cx={146} cy={66} r={14} fill={p.a} />
      <Bar x={168} y={56} w={80} h={9} fill={p.deep} />
      <Bar x={168} y={71} w={56} fill={p.mid} />
      <rect x={134} y={96} width={132} height={1} fill={p.line} />
      {[108, 150].map((y) => (
        <g key={y}>
          <Bar x={134} y={y} w={42} h={6} fill={p.a} />
          <Bar x={134} y={y + 13} w={120} />
          <Bar x={134} y={y + 24} w={104} />
        </g>
      ))}
      <Bar x={134} y={196} w={42} h={6} fill={p.a} />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={134 + i * 42} y={210} width={36} height={14} rx={7} fill={p.soft} />
      ))}
    </>
  ),
  calendar: (p) => (
    <>
      <Sheet x={78} y={44} w={244} h={212} r={14} />
      <Bar x={98} y={64} w={86} h={10} fill={p.deep} />
      <circle cx={290} cy={69} r={6} fill={p.mid} />
      <circle cx={274} cy={69} r={6} fill={p.line} />
      {Array.from({ length: 28 }).map((_, i) => {
        const col = i % 7;
        const row = Math.floor(i / 7);
        const hot = [2, 5, 9, 11, 16, 20, 23].includes(i);
        return (
          <rect
            key={i}
            x={98 + col * 30}
            y={92 + row * 38}
            width={24}
            height={30}
            rx={6}
            fill={hot ? (i % 3 === 0 ? p.a : p.mid) : "#f4f2ee"}
          />
        );
      })}
    </>
  ),
  kit: (p) => (
    <>
      <g transform="rotate(-10 200 170)">
        <rect x={104} y={84} width={150} height={170} rx={14} fill={p.mid} />
      </g>
      <g transform="rotate(6 200 170)">
        <rect x={150} y={70} width={150} height={170} rx={14} fill={p.soft} stroke={p.mid} />
      </g>
      <rect x={124} y={60} width={152} height={186} rx={14} fill="#fff" stroke="#e6e2da" />
      <rect x={124} y={60} width={152} height={52} rx={14} fill={p.deep} />
      <rect x={124} y={98} width={152} height={14} fill={p.deep} />
      <Bar x={142} y={80} w={70} h={9} fill="#fff" />
      {[130, 158, 186, 214].map((y, i) => (
        <g key={y}>
          <rect x={142} y={y} width={14} height={14} rx={4} fill={i < 2 ? p.a : "#efece6"} />
          <Bar x={164} y={y + 4} w={i % 2 ? 74 : 92} />
        </g>
      ))}
    </>
  ),
  prompts: (p) => (
    <>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${70 + i * 14} ${50 + i * 66})`}>
          <rect width={232} height={54} rx={14} fill={i === 1 ? p.deep : "#fff"} stroke={i === 1 ? "none" : "#e6e2da"} />
          <rect x={14} y={15} width={24} height={24} rx={7} fill={i === 1 ? p.a : p.soft} />
          <text x={21} y={32} fontSize={14} fontFamily="ui-monospace,monospace" fill={i === 1 ? "#fff" : p.deep}>
            /
          </text>
          <Bar x={50} y={17} w={i === 2 ? 120 : 150} fill={i === 1 ? "rgba(255,255,255,.85)" : "#dedad2"} />
          <Bar x={50} y={30} w={i === 0 ? 96 : 120} fill={i === 1 ? "rgba(255,255,255,.35)" : "#eeebe5"} />
        </g>
      ))}
    </>
  ),
  proposal: (p) => (
    <>
      <Sheet x={102} y={30} w={196} h={240} />
      <rect x={102} y={30} width={6} height={240} rx={3} fill={p.a} />
      <Bar x={124} y={52} w={44} h={6} fill={p.a} />
      <Bar x={124} y={66} w={120} h={12} fill={p.deep} r={4} />
      <Bar x={124} y={86} w={86} />
      <rect x={124} y={112} width={154} height={92} rx={8} fill="#faf9f6" stroke="#eeebe5" />
      {[124, 146, 168].map((y) => (
        <g key={y}>
          <Bar x={136} y={y} w={70} h={6} />
          <Bar x={238} y={y} w={28} h={6} fill="#d9d5cc" />
        </g>
      ))}
      <rect x={124} y={188} width={154} height={1} fill="#e6e2da" />
      <Bar x={136} y={214} w={44} h={8} fill={p.deep} />
      <Bar x={226} y={214} w={40} h={8} fill={p.a} />
      <Bar x={124} y={240} w={62} h={14} fill={p.soft} r={7} />
    </>
  ),
  planner: (p) => (
    <>
      <rect x={96} y={40} width={208} height={222} rx={16} fill={p.deep} />
      <rect x={108} y={48} width={190} height={206} rx={10} fill="#fff" />
      {Array.from({ length: 7 }).map((_, i) => (
        <rect key={i} x={100} y={62 + i * 28} width={18} height={6} rx={3} fill={p.mid} />
      ))}
      <Bar x={132} y={68} w={76} h={10} fill={p.deep} />
      {[96, 124, 152, 180, 208].map((y, i) => (
        <g key={y}>
          <rect x={132} y={y} width={14} height={14} rx={4} fill={i < 3 ? p.a : "none"} stroke={i < 3 ? "none" : "#d9d5cc"} />
          {i < 3 && <path d={`M${135} ${y + 7} l3 3 l5 -6`} stroke="#fff" strokeWidth={2} fill="none" strokeLinecap="round" />}
          <Bar x={156} y={y + 4} w={[110, 86, 120, 70, 98][i]} fill={i < 3 ? "#e3dfd7" : "#efece6"} />
        </g>
      ))}
    </>
  ),
  social: (p) => (
    <>
      {Array.from({ length: 9 }).map((_, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = 116 + col * 58;
        const y = 50 + row * 70;
        const fills = [p.a, p.soft, p.deep, p.mid, "#fff", p.a, p.soft, p.deep, p.mid];
        return (
          <g key={i}>
            <rect x={x} y={y} width={50} height={62} rx={9} fill={fills[i]} stroke={fills[i] === "#fff" ? "#e6e2da" : "none"} />
            {i % 4 === 0 && <circle cx={x + 25} cy={y + 28} r={11} fill="rgba(255,255,255,.75)" />}
            {i % 4 === 1 && <rect x={x + 10} y={y + 40} width={30} height={6} rx={3} fill={p.deep} opacity={0.5} />}
            {i % 4 === 2 && <path d={`M${x + 10} ${y + 48} l12 -16 l9 10 l9 -6 v12z`} fill="rgba(255,255,255,.55)" />}
          </g>
        );
      })}
    </>
  ),
  ops: (p) => (
    <>
      <Sheet x={68} y={46} w={264} h={208} r={14} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={86 + i * 78} y={64} width={68} height={46} rx={9} fill={i === 0 ? p.soft : "#f6f4f0"} />
          <Bar x={96 + i * 78} y={74} w={30} h={5} fill="#cfcac0" />
          <Bar x={96 + i * 78} y={88} w={42} h={10} fill={i === 0 ? p.a : p.deep} r={4} />
        </g>
      ))}
      {[52, 78, 64, 96, 84, 110, 72].map((h, i) => (
        <rect key={i} x={96 + i * 30} y={232 - h} width={16} height={h} rx={5} fill={i === 5 ? p.a : p.mid} />
      ))}
    </>
  ),
  interview: (p) => (
    <>
      <rect x={70} y={60} width={190} height={70} rx={20} fill="#fff" stroke="#e6e2da" />
      <path d="M100 130 l-6 18 l22 -18z" fill="#fff" stroke="#e6e2da" />
      <text x={90} y={103} fontSize={22} fontWeight={600} fill={p.a} fontFamily="ui-sans-serif,system-ui">Q</text>
      <Bar x={116} y={86} w={118} />
      <Bar x={116} y={100} w={86} fill="#efece6" />
      <rect x={140} y={160} width={190} height={78} rx={20} fill={p.deep} />
      <path d="M300 238 l8 18 l-26 -18z" fill={p.deep} />
      <text x={160} y={207} fontSize={22} fontWeight={600} fill={p.mid} fontFamily="ui-sans-serif,system-ui">A</text>
      <Bar x={186} y={186} w={120} fill="rgba(255,255,255,.8)" />
      <Bar x={186} y={200} w={96} fill="rgba(255,255,255,.4)" />
      <Bar x={186} y={214} w={108} fill="rgba(255,255,255,.4)" />
    </>
  ),
  finance: (p) => (
    <>
      <Sheet x={74} y={50} w={252} h={200} r={14} />
      <circle cx={150} cy={150} r={52} fill="none" stroke="#f0ede7" strokeWidth={22} />
      <circle cx={150} cy={150} r={52} fill="none" stroke={p.a} strokeWidth={22} strokeDasharray="150 400" transform="rotate(-90 150 150)" />
      <circle cx={150} cy={150} r={52} fill="none" stroke={p.mid} strokeWidth={22} strokeDasharray="90 400" strokeDashoffset={-150} transform="rotate(-90 150 150)" />
      <circle cx={150} cy={150} r={52} fill="none" stroke={p.deep} strokeWidth={22} strokeDasharray="50 400" strokeDashoffset={-240} transform="rotate(-90 150 150)" />
      {[p.a, p.mid, p.deep].map((c, i) => (
        <g key={i}>
          <rect x={224} y={110 + i * 28} width={10} height={10} rx={3} fill={c} />
          <Bar x={242} y={111 + i * 28} w={60 - i * 10} />
        </g>
      ))}
    </>
  ),
  study: (p) => (
    <>
      {[p.deep, p.a, p.mid].map((c, i) => (
        <g key={i} transform={`translate(${92 + i * 10} ${190 - i * 46})`}>
          <rect width={216 - i * 20} height={40} rx={8} fill={c} />
          <rect x={14} y={14} width={60} height={12} rx={4} fill="rgba(255,255,255,.55)" />
          <rect x={196 - i * 20 - 30} y={0} width={10} height={40} fill="rgba(255,255,255,.25)" />
        </g>
      ))}
      <rect x={236} y={44} width={64} height={54} rx={10} fill="#fff" stroke="#e6e2da" transform="rotate(8 268 70)" />
      <Bar x={248} y={62} w={36} h={6} fill={p.a} />
    </>
  ),
  checklist: (p) => (
    <>
      <Sheet x={110} y={36} w={180} h={228} r={16} />
      <rect x={170} y={26} width={60} height={20} rx={8} fill={p.deep} />
      <Bar x={132} y={66} w={90} h={10} fill={p.deep} />
      {[94, 126, 158, 190, 222].map((y, i) => (
        <g key={y}>
          <circle cx={140} cy={y + 8} r={9} fill={i < 4 ? p.a : "#fff"} stroke={i < 4 ? "none" : "#d9d5cc"} />
          {i < 4 && <path d={`M${135} ${y + 8} l3.5 3.5 l6 -7`} stroke="#fff" strokeWidth={2} fill="none" strokeLinecap="round" />}
          <Bar x={158} y={y + 4} w={[100, 78, 110, 90, 70][i]} />
        </g>
      ))}
    </>
  ),
  dashboard: (p) => (
    <>
      <Sheet x={60} y={52} w={280} h={196} r={14} />
      {[0, 1, 2].map((col) => (
        <g key={col}>
          <Bar x={78 + col * 88} y={70} w={44} h={6} fill={col === 0 ? p.a : "#d9d5cc"} />
          {Array.from({ length: 3 - (col === 2 ? 1 : 0) }).map((_, row) => (
            <g key={row}>
              <rect x={78 + col * 88} y={88 + row * 50} width={76} height={42} rx={8} fill={col === 1 && row === 0 ? p.soft : "#f6f4f0"} />
              <Bar x={88 + col * 88} y={98 + row * 50} w={48} h={6} fill={col === 1 && row === 0 ? p.a : "#dedad2"} />
              <Bar x={88 + col * 88} y={110 + row * 50} w={34} h={5} fill="#e9e6df" />
            </g>
          ))}
        </g>
      ))}
    </>
  ),
};

export const ARTWORK_KEYS = Object.keys(art);

export function ProductArt({
  artwork,
  hue,
  className,
  label,
}: {
  artwork: string;
  hue: number;
  className?: string;
  label?: string;
}) {
  const p = palette(hue);
  const render = art[artwork] ?? art.kit;
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ background: `linear-gradient(155deg, hsl(${hue} 60% 97%) 0%, hsl(${hue} 48% 91%) 100%)` }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg viewBox="0 0 400 300" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id={`dots-${hue}`} width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1" fill={`hsl(${hue} 35% 60% / 0.18)`} />
          </pattern>
          <filter id={`art-shadow-${hue}`} x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor={`hsl(${hue} 40% 30%)`} floodOpacity="0.12" />
          </filter>
        </defs>
        <rect width="400" height="300" fill={`url(#dots-${hue})`} />
        <g filter={`url(#art-shadow-${hue})`}>{render(p)}</g>
      </svg>
    </div>
  );
}
