import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function NotFound() {
  const t = await getTranslations('notFound');
  return (
    <section className="surface-midnight relative isolate flex min-h-[80svh] items-center overflow-hidden pt-[var(--header-height)]">
      <div aria-hidden className="absolute inset-0 -z-10" style={{ background: 'var(--gradient-hero)' }} />
      <div aria-hidden className="bg-grid absolute inset-0 -z-10" />
      <div className="container-x py-20">
        <p className="eyebrow">{t('eyebrow')}</p>
        <h1 className="display-lg mt-6 max-w-3xl">{t('title')}</h1>
        <p className="lead mt-6 text-mist">{t('body')}</p>
        <Link href="/" className="btn btn-primary mt-10">
          {t('cta')}
          <ArrowRight aria-hidden className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
