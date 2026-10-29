import { Briefcase, GraduationCap } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import type { Milestone } from '@/content';
import { cn } from '@/lib/cn';
import { Reveal } from '@/components/motion/Reveal';

/**
 * Chronological timeline. Vertical with a left rail on small screens;
 * alternating sides around a central rail on large screens.
 * Category is conveyed by icon and text, never colour alone.
 */
export async function MilestoneTimeline({ locale, milestones }: { locale: Locale; milestones: Milestone[] }) {
  const t = await getTranslations({ locale, namespace: 'home.journey' });

  return (
    <ol className="relative">
      <span aria-hidden className="absolute top-2 bottom-2 left-[1.0625rem] w-px bg-line-dark lg:left-1/2" />
      {milestones.map((m, index) => {
        const Icon = m.kind === 'education' ? GraduationCap : Briefcase;
        const right = index % 2 === 1;
        return (
          <Reveal
            as="li"
            key={m.id}
            delay={60}
            className={cn(
              'relative grid grid-cols-[2.25rem_1fr] gap-x-5 pb-10 last:pb-0 lg:grid-cols-[1fr_2.25rem_1fr] lg:gap-x-10',
            )}
          >
            <span
              className={cn(
                'relative z-10 col-start-1 row-span-2 mt-1 flex h-9 w-9 items-center justify-center rounded-full border bg-white lg:col-start-2',
                m.year === null ? 'border-gold bg-midnight text-gold' : 'border-line-dark text-gold-ink',
              )}
            >
              <Icon aria-hidden className="h-4 w-4" />
            </span>
            <div className={cn('col-start-2 lg:row-start-1', right ? 'lg:col-start-3' : 'lg:col-start-1 lg:text-right')}>
              <p className="font-serif text-3xl leading-none text-ink">{m.year ?? t('current')}</p>
              <p className="mt-2 text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase">
                {m.kind === 'education' ? t('education') : t('career')}
              </p>
              <h3 className="mt-2 font-display text-lg font-semibold">{m.title}</h3>
              {m.subtitle && <p className="mt-1 text-ink-muted">{m.subtitle}</p>}
            </div>
          </Reveal>
        );
      })}
    </ol>
  );
}
