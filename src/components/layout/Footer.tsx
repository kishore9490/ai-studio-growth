import { ArrowUp } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getCopy } from '@/content';
import { officialLinks } from '@/content/sources';
import { flatNav } from '@/lib/routes';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { Monogram } from './Monogram';

export async function Footer({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'footer' });
  const nav = await getTranslations({ locale, namespace: 'nav' });
  const common = await getTranslations({ locale, namespace: 'common' });
  const profile = getCopy(locale).profile;
  const year = new Date().getFullYear();

  return (
    <footer className="surface-midnight relative overflow-hidden border-t border-line">
      <div aria-hidden className="hairline absolute inset-x-0 top-0" />
      <div className="container-x grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:py-20">
        <div>
          <div className="flex items-center gap-4">
            <Monogram className="h-12 w-12" />
            <p className="font-display text-lg font-semibold">{profile.name}</p>
          </div>
          <p className="mt-5 max-w-sm text-mist">{t('tagline')}</p>
          <p className="mt-4 text-sm text-mist">{profile.qualificationsLine}</p>
        </div>

        <nav aria-labelledby="footer-explore">
          <h2 id="footer-explore" className="eyebrow">
            {t('explore')}
          </h2>
          <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2.5">
            {flatNav.map((item) => (
              <li key={item.key}>
                <Link href={item.href} className="link-underline text-white/80 transition-colors hover:text-white">
                  {nav(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="eyebrow">{t('official')}</h2>
          <ul className="mt-5 space-y-3 text-white/80">
            <li>
              <ExternalLink href={officialLinks.vcProfile} className="link-underline hover:text-white">
                {common('officialProfile')}
              </ExternalLink>
            </li>
            <li>
              <ExternalLink href={officialLinks.vcDesk} className="link-underline hover:text-white">
                {common('vcMessage')}
              </ExternalLink>
            </li>
            <li>
              <ExternalLink href={officialLinks.university} className="link-underline hover:text-white">
                {common('university')}
              </ExternalLink>
            </li>
          </ul>
        </div>
      </div>

      <div aria-hidden className="container-x overflow-hidden">
        <p className="watermark -mb-[0.12em] text-center text-[clamp(2.5rem,8.4vw,8.25rem)] [-webkit-text-stroke:1px_rgb(201_173_120/0.22)]">
          {profile.name}
        </p>
      </div>

      <div className="border-t border-line">
        <div className="container-x grid gap-6 py-8 text-sm text-mist md:grid-cols-[1fr_auto] md:items-end">
          <div className="max-w-3xl">
            <h2 className="font-display font-semibold text-white">{t('disclaimerTitle')}</h2>
            <p className="mt-2">{t('disclaimer')}</p>
            <p className="mt-4">{t('copyright', { year })}</p>
          </div>
          <a
            href="#top"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-line px-4 py-2.5 text-white/80 transition-colors hover:border-gold hover:text-white"
          >
            <ArrowUp aria-hidden className="h-4 w-4" />
            {t('backToTop')}
          </a>
        </div>
      </div>
    </footer>
  );
}
