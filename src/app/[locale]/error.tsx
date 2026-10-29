'use client';

import { RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('error');
  return (
    <section className="surface-midnight flex min-h-[80svh] items-center pt-[var(--header-height)]">
      <div className="container-x py-20">
        <p className="eyebrow">{t('eyebrow')}</p>
        <h1 className="display-lg mt-6">{t('title')}</h1>
        <p className="lead mt-6 text-mist">{t('body')}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="btn btn-primary">
            <RotateCcw aria-hidden className="h-4 w-4" />
            {t('retry')}
          </button>
          <Link href="/" className="btn btn-ghost">
            {t('home')}
          </Link>
        </div>
      </div>
    </section>
  );
}
