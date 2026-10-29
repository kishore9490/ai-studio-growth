import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Briefcase,
  GraduationCap,
  HeartHandshake,
  Landmark,
  Microscope,
  MonitorSmartphone,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getCareer, getCopy, getFocusAreas, getMilestones, getPortrait, getQualifications, getVisionPriorities } from '@/content';
import type { FocusAreaId } from '@/content/ids';
import { cn } from '@/lib/cn';
import { Parallax } from '@/components/motion/Parallax';
import { Reveal } from '@/components/motion/Reveal';
import { Spotlight } from '@/components/motion/Spotlight';
import { Rail } from '@/components/ui/Rail';

function Eyebrow({ children, className }: { children: string; className?: string }) {
  return <p className={cn('pill', className)}>{children}</p>;
}

export async function IntroSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home.intro' });
  const hero = await getTranslations({ locale, namespace: 'home.hero' });
  const profile = getCopy(locale).profile;
  const portrait = getPortrait();

  return (
    <section id="introduction" aria-labelledby="intro-title" className="surface-ivory section relative overflow-hidden">
      <div aria-hidden className="bg-grid-light absolute inset-0" />
      <div className="container-x relative grid items-center gap-14 lg:grid-cols-12 lg:gap-16">
        {portrait && (
          <Reveal className="relative mx-auto w-full max-w-sm lg:col-span-5 lg:max-w-none">
            <div aria-hidden className="absolute -inset-3 translate-x-4 translate-y-4 rounded-[2rem] border border-gold-ink/30 sm:-inset-4" />
            <div className="relative overflow-hidden rounded-[2rem] bg-white shadow-lift">
              <Image
                src={portrait.src}
                alt={profile.name}
                width={portrait.width}
                height={portrait.height}
                sizes="(min-width: 1024px) 34vw, (min-width: 640px) 24rem, 90vw"
                className="aspect-[4/4.4] w-full object-cover object-top"
              />
              <div className="glass absolute inset-x-4 bottom-4 rounded-2xl !bg-midnight/70 px-5 py-4 text-white">
                <p className="font-display text-sm font-semibold">{profile.name}</p>
                <p className="text-xs text-mist">
                  {hero('portraitCaption')}, {profile.institutionShort}
                </p>
              </div>
            </div>
          </Reveal>
        )}
        <Reveal className={portrait ? 'lg:col-span-6 lg:col-start-7' : 'lg:col-span-8'} delay={120}>
          <Eyebrow>{t('eyebrow')}</Eyebrow>
          <h2 id="intro-title" className="mt-6 font-serif text-[clamp(2.25rem,4.6vw,4rem)] leading-[1.05] font-normal tracking-[-0.01em]">
            {t('title')}
          </h2>
          <p className="lead mt-7 text-ink">{t('body')}</p>
          <Link href="/about" className="btn btn-dark mt-10">
            {t('cta')}
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/** Bento grid of facts. Every figure is computed from the content records. */
export async function HighlightsSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home.highlights' });
  const profile = getCopy(locale).profile;
  const qualifications = getQualifications(locale);
  const frcs = qualifications.filter((q) => q.credential.startsWith('FRCS'));
  const year = (credential: string) => frcs.find((q) => q.credential.includes(credential))?.endYear ?? '';
  const faculty = getCareer(locale).find((c) => c.id === 'faculty-kims');
  const priorities = getVisionPriorities(locale);

  const small = 'card-glow p-6 sm:p-7 flex flex-col';
  const big = 'font-display text-[clamp(2.75rem,5vw,4rem)] leading-none font-extrabold tracking-[-0.04em] text-gradient-gold';

  return (
    <section aria-labelledby="highlights-title" className="surface-mesh section relative isolate overflow-hidden">
      <div aria-hidden className="bg-grid absolute inset-0 -z-10" />
      <div className="container-x">
        <Reveal className="max-w-3xl">
          <Eyebrow>{t('eyebrow')}</Eyebrow>
          <h2 id="highlights-title" className="display-lg mt-6">
            {t('title')}
          </h2>
        </Reveal>

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
          <Spotlight as="li" className="card-glow relative flex min-h-[20rem] flex-col justify-between p-7 sm:col-span-2 sm:p-9 lg:row-span-2">
            <svg aria-hidden viewBox="0 0 300 300" className="pointer-events-none absolute -top-16 -right-16 h-80 w-80 text-white/[0.07]">
              {[148, 118, 88, 58].map((r) => (
                <circle key={r} cx="150" cy="150" r={r} fill="none" stroke="currentColor" />
              ))}
              <circle cx="150" cy="150" r="103" fill="none" stroke="var(--color-gold)" strokeOpacity="0.35" strokeDasharray="1 7" />
            </svg>
            <div className="relative">
              <span className="icon-tile">
                <Landmark aria-hidden className="card-icon h-6 w-6 text-gold transition-transform duration-300" />
              </span>
              <p className="mt-8 text-xs font-semibold tracking-[0.16em] text-gold uppercase">{t('currentRole')}</p>
              <h3 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-[1.05] font-bold tracking-tight text-white">
                {profile.role}
              </h3>
              <p className="mt-4 max-w-md text-lg text-mist">{t('vcBody')}</p>
            </div>
            <Link href="/vision" className="relative mt-8 inline-flex w-fit items-center gap-2 font-display font-semibold text-gold transition-colors hover:text-white">
              {t('explore')}
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </Spotlight>

          <Spotlight as="li" className={small}>
            <p className={big}>{qualifications.length}</p>
            <h3 className="mt-4 font-display text-lg font-semibold text-white">{t('qualifications')}</h3>
            <p className="mt-1 text-sm text-mist">{t('qualificationsBody')}</p>
          </Spotlight>

          <Spotlight as="li" className={small}>
            <p className={big}>{frcs.length}</p>
            <h3 className="mt-4 font-display text-lg font-semibold text-white">{t('fellowships')}</h3>
            <p className="mt-1 text-sm text-mist">{t('fellowshipsBody', { edinburgh: year('Edinburgh'), glasgow: year('Glasgow') })}</p>
          </Spotlight>

          {faculty?.startYear && (
            <Spotlight as="li" className={small}>
              <p className={big}>{faculty.startYear}</p>
              <p className="mt-4 text-sm text-mist">{t('facultyBody')}</p>
            </Spotlight>
          )}

          <Spotlight as="li" className={small}>
            <p className={big}>{priorities.length}</p>
            <h3 className="mt-4 font-display text-lg font-semibold text-white">{t('priorities')}</h3>
            <p className="mt-1 text-sm text-mist">{t('prioritiesBody')}</p>
          </Spotlight>
        </ul>
      </div>
    </section>
  );
}

export async function JourneySection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home.journey' });
  const milestones = getMilestones(locale);

  return (
    <section aria-labelledby="journey-title" className="surface-white section overflow-hidden">
      <div className="container-x flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <Reveal className="max-w-3xl">
          <Eyebrow>{t('eyebrow')}</Eyebrow>
          <h2 id="journey-title" className="display-lg mt-6">
            {t('title')}
          </h2>
          <p className="lead mt-5 text-ink-muted">{t('body')}</p>
        </Reveal>
        <Reveal>
          <Link href="/experience" className="btn btn-outline shrink-0">
            {t('cta')}
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>

      <Rail className="mt-14" label={t('railLabel')} previousLabel={t('previous')} nextLabel={t('next')}>
        {milestones.map((m, index) => {
          const Icon = m.kind === 'education' ? GraduationCap : Briefcase;
          const current = m.year === null;
          return (
            <Spotlight
              as="li"
              key={m.id}
              className={cn(
                'relative flex min-h-[17rem] flex-col rounded-[var(--radius-xl)] p-7 transition-transform duration-200',
                current ? 'surface-mesh text-white shadow-lift' : 'card-soft',
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn('icon-tile !h-11 !w-11', current && '!border-white/20')}>
                  <Icon aria-hidden className={cn('h-5 w-5', current ? 'text-gold' : 'text-gold-ink')} />
                </span>
                <span aria-hidden className={cn('font-display text-sm tabular-nums', current ? 'text-white/50' : 'text-ink-muted/60')}>
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <p className={cn('mt-8 font-display text-5xl font-extrabold tracking-[-0.04em]', current ? 'text-gradient-gold' : 'text-ink')}>
                {m.year ?? t('current')}
              </p>
              <p className={cn('mt-3 text-xs font-semibold tracking-[0.14em] uppercase', current ? 'text-gold' : 'text-ink-muted')}>
                {m.kind === 'education' ? t('education') : t('career')}
              </p>
              <h3 className="mt-2 font-display text-lg leading-snug font-semibold">{m.title}</h3>
              {m.subtitle && <p className={cn('mt-1 text-sm', current ? 'text-mist' : 'text-ink-muted')}>{m.subtitle}</p>}
            </Spotlight>
          );
        })}
      </Rail>
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
    <section aria-labelledby="focus-title" className="surface-ivory section relative overflow-hidden">
      <div aria-hidden className="bg-grid-light absolute inset-0" />
      <div className="container-x relative">
        <Reveal className="mx-auto max-w-3xl text-center">
          <Eyebrow>{t('eyebrow')}</Eyebrow>
          <h2 id="focus-title" className="display-lg mt-6">
            {t('title')}
          </h2>
          <p className="lead mt-5 text-ink-muted">{t('body')}</p>
        </Reveal>
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area, index) => {
            const Icon = focusIcons[area.id];
            return (
              <Reveal as="li" key={area.id} delay={(index % 3) * 90}>
                <Spotlight className="card-soft h-full p-7 sm:p-8">
                  <span className="icon-tile">
                    <Icon aria-hidden className="card-icon h-6 w-6 text-navy transition-transform duration-300" strokeWidth={1.6} />
                  </span>
                  <h3 className="mt-6 font-display text-xl font-semibold">{area.title}</h3>
                  <p className="mt-3 text-ink-muted">{area.body}</p>
                </Spotlight>
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
    <section aria-labelledby="vision-preview-title" className="surface-dark section relative isolate overflow-hidden">
      <div aria-hidden className="bg-grid absolute inset-0 -z-10" />
      <div className="container-x grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <Reveal>
              <Eyebrow>{t('eyebrow')}</Eyebrow>
              <h2 id="vision-preview-title" className="display-lg mt-6">
                {t('title')}
              </h2>
              <p className="lead mt-6 text-mist">{t('body')}</p>
              <Link href="/vision" className="btn btn-primary mt-10">
                {t('cta')}
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </Reveal>
          </div>
        </div>
        <ol className="space-y-3 lg:col-span-7 lg:col-start-6">
          {priorities.map((p) => (
            <Reveal as="li" key={p.id}>
              <Link
                href={`/vision#${p.id}`}
                className="group grid grid-cols-[3.25rem_1fr_auto] items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-[background-color,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-gold/40 hover:bg-white/[0.07] sm:grid-cols-[4rem_1fr_auto] sm:p-6"
              >
                <span aria-hidden className="text-gradient-gold font-display text-3xl leading-none font-extrabold tabular-nums">
                  {String(p.number).padStart(2, '0')}
                </span>
                <span>
                  <span className="block font-display text-lg font-semibold text-white sm:text-xl">{p.title}</span>
                  <span className="mt-1.5 block text-mist">{p.summary}</span>
                  <span className="mt-3 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-gold/90 uppercase">
                    {common('statedPriority')}
                  </span>
                </span>
                <ArrowUpRight
                  aria-hidden
                  className="mt-1 h-5 w-5 text-white/40 transition-[color,transform] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gold"
                />
              </Link>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

export async function ClosingSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home.closing' });
  const portrait = getPortrait();
  return (
    <section aria-labelledby="closing-title" className="surface-ivory section">
      <div className="container-x">
        <Reveal className="surface-mesh relative isolate overflow-hidden rounded-[2.25rem] px-6 py-16 sm:px-12 lg:px-16 lg:py-20">
          <div aria-hidden className="bg-grid absolute inset-0 -z-10" />
          <Parallax offset={40} className="pointer-events-none absolute top-1/2 -right-40 -z-10 -translate-y-1/2">
            <svg viewBox="0 0 800 800" className="h-[44rem] w-[44rem] text-white/[0.07]">
              {[390, 310, 230, 150].map((r) => (
                <circle key={r} cx="400" cy="400" r={r} fill="none" stroke="currentColor" />
              ))}
            </svg>
          </Parallax>
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <p className="pill">{t('eyebrow')}</p>
              <h2 id="closing-title" className="mt-8 font-serif text-[clamp(2rem,4.4vw,3.5rem)] leading-[1.12] font-normal text-ivory">
                {t('statement')}
              </h2>
              <p className="lead mt-8 max-w-2xl text-mist">{t('body')}</p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link href="/vision" className="btn btn-primary">
                  {t('cta')}
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
                <Link href="/about" className="btn btn-ghost">
                  {t('secondaryCta')}
                </Link>
              </div>
            </div>
            {portrait && (
              <div aria-hidden className="relative mx-auto hidden w-full max-w-xs lg:col-span-4 lg:block">
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgb(49_95_234/0.5),transparent)]" />
                <div className="relative aspect-square overflow-hidden rounded-full border border-gold/50 p-2">
                  <Image
                    src={portrait.src}
                    alt=""
                    width={portrait.width}
                    height={portrait.height}
                    sizes="20rem"
                    className="h-full w-full rounded-full object-cover object-top"
                  />
                </div>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
