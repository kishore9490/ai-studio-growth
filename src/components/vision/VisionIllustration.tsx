import type { VisionId } from '@/content/ids';

/** Abstract fine-line illustrations. Decorative; they depict no real place, event or deployment. */
export function VisionIllustration({ id, className }: { id: VisionId; className?: string }) {
  return (
    <svg viewBox="0 0 240 240" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="120" cy="120" r="112" strokeOpacity="0.18" />
      <circle cx="120" cy="120" r="84" strokeOpacity="0.1" strokeDasharray="2 6" />
      {illustrations[id]}
    </svg>
  );
}

const gold = { stroke: 'var(--color-gold)' };

const illustrations: Record<VisionId, React.ReactNode> = {
  'smart-campuses': (
    <g>
      <path d="M60 150 L120 120 L180 150 L120 180 Z" strokeOpacity="0.5" />
      <path d="M78 141 V105 L102 93 V129 M138 129 V81 L162 93 V141 M108 152 V117 L132 105 V140" />
      <path d="M60 150 V156 L120 186 L180 156 V150" strokeOpacity="0.4" />
      <g {...gold}>
        <circle cx="90" cy="70" r="3" />
        <circle cx="150" cy="58" r="3" />
        <circle cx="120" cy="48" r="3" />
        <path d="M90 70 L120 48 L150 58" strokeDasharray="3 4" />
      </g>
    </g>
  ),
  'translational-research': (
    <g>
      <path d="M70 92 l18 -10 l18 10 v20 l-18 10 l-18 -10 Z M106 92 l18 -10 l18 10 v20 l-18 10 l-18 -10 Z M88 122 l18 -10 l18 10 v20 l-18 10 l-18 -10 Z" />
      <path d="M142 112 C 160 112, 160 150, 178 150" strokeDasharray="3 4" />
      <g {...gold}>
        <path d="M178 136 v28 M164 150 h28" strokeWidth="2" />
        <circle cx="178" cy="150" r="20" />
      </g>
    </g>
  ),
  'international-collaboration': (
    <g>
      <circle cx="120" cy="120" r="56" />
      <ellipse cx="120" cy="120" rx="24" ry="56" strokeOpacity="0.6" />
      <path d="M64 120 H176 M72 92 H168 M72 148 H168" strokeOpacity="0.5" />
      <g {...gold}>
        <path d="M58 86 C 90 30, 160 30, 186 90" strokeDasharray="3 5" />
        <circle cx="58" cy="86" r="4" />
        <circle cx="186" cy="90" r="4" />
      </g>
    </g>
  ),
  'rural-outreach': (
    <g>
      <path d="M40 160 C 80 130, 110 150, 140 132 S 190 120, 204 128" strokeOpacity="0.5" />
      <path d="M40 176 C 90 156, 140 174, 204 150" strokeOpacity="0.3" />
      <path d="M98 128 V108 L114 96 L130 108 V128 Z M110 128 v-10 h8 v10" />
      <g {...gold}>
        <path d="M60 80 h22 l8 -16 l10 32 l8 -16 h22" strokeWidth="1.6" />
        <circle cx="164" cy="98" r="10" />
        <path d="M164 92 v12 M158 98 h12" />
      </g>
    </g>
  ),
  'emerging-technologies': (
    <g>
      <rect x="88" y="88" width="64" height="64" rx="8" />
      <rect x="104" y="104" width="32" height="32" rx="4" strokeOpacity="0.6" />
      <path d="M100 88 V70 M120 88 V62 M140 88 V70 M100 152 V170 M120 152 V178 M140 152 V170 M88 104 H70 M88 136 H70 M152 104 H170 M152 136 H170" strokeOpacity="0.7" />
      <g {...gold}>
        <circle cx="100" cy="66" r="4" />
        <circle cx="120" cy="58" r="4" />
        <circle cx="170" cy="104" r="4" />
        <circle cx="140" cy="174" r="4" />
        <circle cx="66" cy="136" r="4" />
        <circle cx="120" cy="120" r="5" />
      </g>
    </g>
  ),
  'affordable-access': (
    <g>
      <path d="M60 172 H92 V150 H118 V128 H144 V106 H170 V84" />
      <path d="M60 172 H190" strokeOpacity="0.4" />
      <g {...gold}>
        <path d="M150 70 h40 v60 h-40 Z" />
        <path d="M150 70 l18 8 v60 l-18 -8" strokeOpacity="0.8" />
        <circle cx="162" cy="106" r="2" />
      </g>
    </g>
  ),
  'student-centred-learning': (
    <g>
      <circle cx="120" cy="120" r="54" strokeOpacity="0.6" />
      <circle cx="120" cy="120" r="30" strokeOpacity="0.8" />
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const r = (deg * Math.PI) / 180;
        return <circle key={deg} cx={120 + 54 * Math.cos(r)} cy={120 + 54 * Math.sin(r)} r="5" />;
      })}
      <g {...gold}>
        <circle cx="120" cy="114" r="8" />
        <path d="M104 138 C 108 126, 132 126, 136 138" />
      </g>
    </g>
  ),
};
