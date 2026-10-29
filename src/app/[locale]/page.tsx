import type { Metadata } from 'next';
import {
  ClosingSection,
  FocusSection,
  HighlightsSection,
  IntroSection,
  JourneySection,
  VisionPreviewSection,
} from '@/components/home/HomeSections';
import { Hero } from '@/components/home/Hero';
import { personJsonLd, serializeJsonLd } from '@/lib/jsonld';
import { buildPageMetadata } from '@/lib/metadata';
import { resolveLocale, type LocaleParams } from '@/lib/page';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  return buildPageMetadata(await resolveLocale(params), 'home');
}

export default async function HomePage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(personJsonLd(locale)) }} />
      <Hero locale={locale} />
      <IntroSection locale={locale} />
      <HighlightsSection locale={locale} />
      <JourneySection locale={locale} />
      <FocusSection locale={locale} />
      <VisionPreviewSection locale={locale} />
      <ClosingSection locale={locale} />
    </>
  );
}
