import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { getCopy, getPortrait } from '@/content';
import { siteConfig } from '@/lib/site';
import { Parallax } from '@/components/motion/Parallax';

/**
 * Art-directed portrait slot. Renders the official portrait only when an
 * authorised image is registered in src/content/records.ts. Until then it
 * renders a typographic composition — never a generated likeness or a stock
 * photograph of another person.
 */
export async function PortraitComposition({ locale }: { locale: Locale }) {
  const portrait = getPortrait();
  const t = await getTranslations({ locale, namespace: 'portrait' });
  const profile = getCopy(locale).profile;

  return (
    <div className="relative mx-auto w-full max-w-[26rem] lg:max-w-none">
      {/* Offset frame behind the main panel */}
      <Parallax offset={24} className="absolute inset-0 translate-x-5 translate-y-5 sm:translate-x-7 sm:translate-y-7">
        <div className="h-full w-full rounded-[var(--radius-xl)] border border-gold/30" />
      </Parallax>

      <div className="enter-mask relative aspect-[4/3] overflow-hidden sm:aspect-[4/5] rounded-[var(--radius-xl)] border border-line bg-navy shadow-glow">
        {portrait ? (
          <Image
            src={portrait.src}
            alt={profile.name}
            width={portrait.width}
            height={portrait.height}
            priority
            sizes="(min-width: 1024px) 40vw, (min-width: 640px) 26rem, 90vw"
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <MonogramArtwork />
        )}

        {/* Hero metadata on a glass surface */}
        <div aria-hidden className="glass absolute inset-x-4 bottom-4 rounded-2xl px-5 py-4 sm:inset-x-6 sm:bottom-6">
          <p className="font-display text-sm font-semibold text-white">{profile.role}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-mist">
            {profile.institution}, {profile.region}
          </p>
        </div>
      </div>

      {!portrait && siteConfig.showDevPlaceholders && (
        <p className="mt-10 text-center text-xs tracking-wide text-gold">{t('pending')}</p>
      )}
    </div>
  );
}

/** Abstract composition: monogram, fine-line knowledge network, light field. */
function MonogramArtwork() {
  const nodes: [number, number][] = [
    [70, 120], [150, 70], [250, 110], [330, 60], [90, 230], [200, 200], [320, 190], [60, 340], [170, 320], [290, 300], [350, 380],
  ];
  const links: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [0, 4], [1, 5], [2, 5], [3, 6], [4, 5], [5, 6], [4, 7], [5, 8], [6, 9], [7, 8], [8, 9], [9, 10], [6, 10],
  ];
  return (
    <div aria-hidden className="absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(70% 55% at 70% 20%, rgb(49 95 234 / 0.45), transparent 70%), radial-gradient(60% 50% at 20% 90%, rgb(201 173 120 / 0.22), transparent 70%), linear-gradient(160deg, #0f2a52, #071426 70%)',
        }}
      />
      <div className="bg-grid absolute inset-0 opacity-70" />
      <svg viewBox="0 0 400 500" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
        <g stroke="white" strokeOpacity="0.16" strokeWidth="0.75">
          {links.map(([a, b]) => {
            const [x1, y1] = nodes[a]!;
            const [x2, y2] = nodes[b]!;
            return <line key={`${a}-${b}`} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
        </g>
        {nodes.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 3 : 2} fill={i % 4 === 0 ? 'var(--color-gold)' : 'white'} fillOpacity="0.7" />
        ))}
        <circle cx="200" cy="230" r="118" fill="none" stroke="var(--color-gold)" strokeOpacity="0.45" />
        <circle cx="200" cy="230" r="146" fill="none" stroke="white" strokeOpacity="0.12" strokeDasharray="2 6" />
        <text
          x="200"
          y="268"
          textAnchor="middle"
          fontFamily="var(--font-serif), Georgia, serif"
          fontSize="128"
          fill="none"
          stroke="var(--color-ivory)"
          strokeOpacity="0.9"
          strokeWidth="1.1"
          letterSpacing="-4"
        >
          BC
        </text>
      </svg>
    </div>
  );
}
