import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement } from 'react';
import en from '@messages/en.json';
import kn from '@messages/kn.json';

export function renderWithIntl(ui: ReactElement, locale: 'en' | 'kn' = 'en') {
  return render(
    <NextIntlClientProvider locale={locale} messages={locale === 'en' ? en : kn}>
      {ui}
    </NextIntlClientProvider>,
  );
}
