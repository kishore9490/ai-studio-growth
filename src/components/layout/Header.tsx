'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useScrolled } from '@/hooks/useScrolled';
import { cn } from '@/lib/cn';
import { DesktopNav } from './DesktopNav';
import { LanguageSwitcher } from './LanguageSwitcher';
import { MobileMenu } from './MobileMenu';
import { Monogram } from './Monogram';

export function Header({ name }: { name: string }) {
  const t = useTranslations('nav');
  const scrolled = useScrolled();

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b text-white transition-[background-color,border-color,backdrop-filter] duration-500',
        scrolled
          ? 'border-line bg-midnight/85 backdrop-blur-xl backdrop-saturate-150'
          : 'border-transparent bg-transparent',
      )}
    >
      <div className="container-x flex h-[var(--header-height)] items-center justify-between gap-6">
        <Link href="/" className="group flex items-center gap-3 rounded-full">
          <Monogram className="h-10 w-10 shrink-0 transition-transform duration-500 group-hover:rotate-[-8deg]" />
          <span className="sr-only font-display text-[0.9375rem] font-semibold tracking-tight sm:not-sr-only">{name}</span>
          <span className="sr-only">, {t('home')}</span>
        </Link>
        <DesktopNav />
        <div className="flex items-center gap-3">
          <LanguageSwitcher className="hidden lg:flex" />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
