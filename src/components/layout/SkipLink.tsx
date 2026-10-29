import { useTranslations } from 'next-intl';

export function SkipLink() {
  const t = useTranslations('nav');
  return (
    <a
      href="#main"
      className="sr-only z-[100] rounded-full bg-gold px-5 py-3 font-display font-semibold text-midnight focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
    >
      {t('skipToContent')}
    </a>
  );
}
