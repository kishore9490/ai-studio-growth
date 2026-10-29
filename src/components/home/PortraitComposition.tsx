import { Award, Landmark } from 'lucide-react';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import type { CSSProperties } from 'react';
import type { Locale } from '@/i18n/routing';
import { getCopy, getPortrait, getQualifications } from '@/content';
import { Parallax } from '@/components/motion/Parallax';

/** Fades the photograph's cropped shoulders and lower edge into the stage. */
const portraitMask: CSSProperties = {
  maskImage:
    'linear-gradient(to bottom, #000 72%, transparent 98%), linear-gradient(to right, transparent 0%, #000 16%, #000 84%, transparent 100%)',
  maskComposite: 'intersect',
  WebkitMaskImage:
    'linear-gradient(to bottom, #000 72%, transparent 98%), linear-gradient(to right, transparent 0%, #000 16%, #000 84%, transparent 100%)',
  WebkitMaskComposite: 'source-in',
};

/**
 * Hero portrait stage: the approved cut-out photograph rising from a glowing
 * ring, with floating glass cards. Falls back to a typographic monogram when
 * no approved portrait is registered (never a generated likeness).
 */
export async function PortraitComposition({ locale }: { locale: Locale }) {
  const portrait = getPortrait();
  const t = await getTranslations({ locale, namespace: 'home.hero' });
  const profile = getCopy(locale).profile;
  const frcs = getQualifications(locale).filter((q) => q.credential.startsWith('FRCS'));

  return (
    <div className="relative mx-auto aspect-[1/1.02] w-full max-w-[19rem] sm:max-w-[28rem] lg:max-w-none">
      {/* Glow and rings */}
      <div aria-hidden className="absolute inset-x-[4%] top-[6%] bottom-[4%]">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgb(49_95_234/0.55),rgb(49_95_234/0.12)_60%,transparent)]" />
        <Parallax offset={18} className="absolute inset-0">
          <svg viewBox="0 0 400 400" className="h-full w-full">
            <circle cx="200" cy="200" r="196" fill="none" stroke="var(--color-gold)" strokeOpacity="0.55" strokeWidth="1" />
            <circle cx="200" cy="200" r="176" fill="none" stroke="white" strokeOpacity="0.12" strokeDasharray="2 7" />
            <circle cx="200" cy="4" r="4" fill="var(--color-gold)" />
            <circle cx="22" cy="270" r="3" fill="white" fillOpacity="0.6" />
          </svg>
        </Parallax>
      </div>

      {portrait ? (
        <div className="enter-portrait absolute inset-x-0 bottom-0 h-full">
          <Image
            src={portrait.cutout.src}
            alt={profile.name}
            width={portrait.cutout.width}
            height={portrait.cutout.height}
            priority
            sizes="(min-width: 1024px) 40vw, (min-width: 640px) 28rem, 22rem"
            className="absolute bottom-0 left-1/2 h-full w-auto max-w-none -translate-x-1/2 object-contain object-bottom"
            style={portraitMask}
          />
        </div>
      ) : (
        <div aria-hidden className="absolute inset-[12%] flex items-center justify-center rounded-full border border-gold/40">
          <span className="font-serif text-[clamp(4rem,12vw,8rem)] text-ivory">BC</span>
        </div>
      )}

      {/* Floating glass cards (decorative duplicates of on-page text) */}
      <Parallax offset={30} className="absolute top-[12%] -left-6 hidden sm:block lg:-left-20">
        <div
          aria-hidden
          className="glass enter-up flex items-center gap-3 rounded-2xl px-3.5 py-3 shadow-[0_20px_40px_-20px_rgb(0_0_0/0.6)] sm:px-4"
          style={{ '--enter-delay': '0.9s' } as CSSProperties}
        >
          <span className="icon-tile !h-9 !w-9 !rounded-xl">
            <Landmark className="h-4 w-4 text-gold" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-sm font-semibold text-white">{t('portraitCaption')}</span>
            <span className="block text-xs text-mist">{profile.institutionShort}</span>
          </span>
        </div>
      </Parallax>

      {frcs.length > 0 && (
        <Parallax offset={46} className="absolute bottom-[14%] -right-4 hidden sm:block lg:-right-10">
          <div
            aria-hidden
            className="glass enter-up flex items-center gap-3 rounded-2xl px-3.5 py-3 shadow-[0_20px_40px_-20px_rgb(0_0_0/0.6)] sm:px-4"
            style={{ '--enter-delay': '1.05s' } as CSSProperties}
          >
            <span className="icon-tile !h-9 !w-9 !rounded-xl">
              <Award className="h-4 w-4 text-gold" />
            </span>
            <span className="leading-tight" lang="en">
              {frcs.map((q) => (
                <span key={q.id} className="block font-display text-sm font-semibold text-white">
                  {q.credential} <span className="font-sans text-xs font-normal text-mist">{q.endYear}</span>
                </span>
              ))}
            </span>
          </div>
        </Parallax>
      )}
    </div>
  );
}
