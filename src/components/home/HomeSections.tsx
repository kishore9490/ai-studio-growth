import {
  ArrowRight,
  BookOpen,
  HeartHandshake,
  Landmark,
  Microscope,
  MonitorSmartphone,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getFocusAreas, getMilestones, getVisionPriorities } from '@/content';
import type { FocusAreaId } from '@/content/ids';
import { Parallax } from '@/components/motion/Parallax';
import { Reveal } from '@/components/motion/Reveal';
import { MilestoneTimeline } from '@/components/timeline/MilestoneTimeline';
import { SectionHeading } from '@/components/ui/SectionHeading';

export async function IntroSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home.intro' });
  return (
    <section id="introduction" aria-labelledby="intro-title" className="surface-ivory section relative overflow-hidden">
      <div aria-hidden className="bg-grid-light absolute inset-0" />
      <div className="container-x relative grid gap-10 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-5">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h2 id="intro-title" className="mt-5 font-serif text-[clamp(2.25rem,4.4vw,3.75rem)] leading-[1.08] font-normal tracking-[-0.01em]">
            {t('title')}
          </h2>
        </Reveal>
        <Reveal className="lg:col-span-6 lg:col-start-7 lg:pt-12" delay={120}>
          <p className="lead text-ink">{t('body')}</p>
          <Link href="/about" className="btn btn-dark mt-10">
            {t('cta')}
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

export async function JourneySection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home.journey' });
  return (
    <section aria-labelledby="journey-title" className="surface-white section">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading id="journey-title" eyebrow={t('eyebrow')} title={t('title')} body={t('body')} />
          <Reveal>
            <Link href="/experience" className="btn btn-outline shrink-0">
              {t('cta')}
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
        <div className="mt-16 lg:mt-20">
          <MilestoneTimeline locale={locale} milestones={getMilestones(locale)} />
        </div>
      </div>
    </section>
  );
}

const focusIcons: Record<FocusAreaId, LucideIcon> = {
  'medical-education': BookOpen,
  'academic-governance': Landmark,
  'surgical-practice': Stethoscope,
  'interdisciplinary-research': Microscope,
  'technology-enabled-education': MonitorSmartphone,
  'community-health': HeartHandshake,
};

export async function FocusSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home.focus' });
  const areas = getFocusAreas(locale);
  return (
    <section aria-labelledby="focus-title" className="surface-dark section relative isolate overflow-hidden">
      <div aria-hidden className="bg-grid absolute inset-0 -z-10" />
      <div className="container-x">
        <SectionHeading id="focus-title" eyebrow={t('eyebrow')} title={t('title')} body={<p className="text-mist">{t('body')}</p>} />
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area, index) => {
            const Icon = focusIcons[area.id];
            return (
              <Reveal as="li" key={area.id} delay={(index % 3) * 90} className="card-dark p-7 sm:p-8">
                <Icon aria-hidden className="card-icon h-7 w-7 text-royal-soft" strokeWidth={1.5} />
                <h3 className="mt-6 font-display text-xl font-semibold text-white">{area.title}</h3>
                <p className="mt-3 text-mist">{area.body}</p>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export async function VisionPreviewSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home.visionPreview' });
  const common = await getTranslations({ locale, namespace: 'common' });
  const priorities = getVisionPriorities(locale);
  return (
    <section aria-labelledby="vision-preview-title" className="surface-ivory section">
      <div className="container-x grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <SectionHeading id="vision-preview-title" eyebrow={t('eyebrow')} title={t('title')} body={<p className="text-ink-muted">{t('body')}</p>} />
            <Reveal>
              <Link href="/vision" className="btn btn-dark mt-10">
                {t('cta')}
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </Reveal>
          </div>
        </div>
        <ol className="lg:col-span-7 lg:col-start-6">
          {priorities.map((p) => (
            <Reveal
              as="li"
              key={p.id}
              className="group grid grid-cols-[3.5rem_1fr] gap-4 border-t border-line-dark py-7 last:border-b sm:grid-cols-[4.5rem_1fr]"
            >
              <span aria-hidden className="font-serif text-3xl leading-none text-gold-ink transition-transform duration-500 group-hover:-translate-y-0.5">
                {String(p.number).padStart(2, '0')}
              </span>
              <div>
                <h3 className="font-display text-xl font-semibold">{p.title}</h3>
                <p className="mt-2 text-ink-muted">{p.summary}</p>
                <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-ink-muted uppercase">
                  <span aria-hidden className="h-px w-5 bg-gold-ink" />
                  {common('statedPriority')}
                </p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

export async function ClosingSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home.closing' });
  return (
    <section aria-labelledby="closing-title" className="surface-dark section relative isolate overflow-hidden">
      <Parallax offset={60} className="pointer-events-none absolute top-1/2 left-1/2 -z-10 -translate-x-1/2 -translate-y-1/2">
        <svg viewBox="0 0 800 800" className="h-[46rem] w-[46rem] max-w-none text-white/[0.07]">
          {[390, 310, 230, 150].map((r) => (
            <circle key={r} cx="400" cy="400" r={r} fill="none" stroke="currentColor" />
          ))}
          <circle cx="400" cy="400" r="270" fill="none" stroke="var(--color-gold)" strokeOpacity="0.2" strokeDasharray="1 9" />
        </svg>
      </Parallax>
      <div className="container-x">
        <Reveal className="mx-auto max-w-4xl text-center">
          <p className="eyebrow justify-center">{t('eyebrow')}</p>
          <h2 id="closing-title" className="mt-8 font-serif text-[clamp(2rem,4.4vw,3.5rem)] leading-[1.15] font-normal text-ivory">
            {t('statement')}
          </h2>
          <div aria-hidden className="hairline mx-auto mt-10 w-40" />
          <p className="lead mx-auto mt-10 max-w-2xl text-mist">{t('body')}</p>
          <Link href="/vision" className="btn btn-ghost mt-10">
            {t('cta')}
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
