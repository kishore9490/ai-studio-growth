'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useScrolled } from '@/hooks/useScrolled';
import { cn } from '@/lib/cn';
import { DesktopNav } from './DesktopNav';
import { LanguageSwitcher } from './LanguageSwitcher';
import { MobileMenu } from './MobileMenu';
import { Monogram } from './Monogram';

/** Floating pill navigation that firms up once the page scrolls. */
export function Header({ name }: { name: string }) {
  const t = useTranslations('nav');
  const scrolled = useScrolled();

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 text-white sm:px-4 sm:pt-4">
      <div
        className={cn(
          'mx-auto flex h-[3.75rem] max-w-[calc(var(--container-max)+2rem)] items-center justify-between gap-6 rounded-full border pr-2 pl-2.5 transition-[background-color,border-color,box-shadow] duration-500 sm:pl-3',
          scrolled
            ? 'border-white/12 bg-midnight/80 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.6)] backdrop-blur-xl backdrop-saturate-150'
            : 'border-white/10 bg-white/[0.04] backdrop-blur-md',
        )}
      >
        <Link href="/" className="group flex items-center gap-3 rounded-full pr-2">
          <Monogram className="h-10 w-10 shrink-0 transition-transform duration-500 group-hover:rotate-[-8deg]" />
          <span className="sr-only font-display text-[0.9375rem] font-semibold tracking-tight sm:not-sr-only">{name}</span>
          <span className="sr-only">, {t('home')}</span>
        </Link>
        <DesktopNav />
        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden lg:flex" />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
