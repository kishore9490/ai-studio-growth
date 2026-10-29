import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AnchorHTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from './test-utils';

vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/vision',
  Link: ({ href, locale, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { locale?: string }) => (
    <a href={locale ? `/${locale}${href === '/' ? '' : href}` : String(href)} {...props} />
  ),
}));

const { MobileMenu } = await import('@/components/layout/MobileMenu');
const { LanguageSwitcher } = await import('@/components/layout/LanguageSwitcher');

describe('MobileMenu', () => {
  it('opens, traps focus, marks the current page and closes on Escape', async () => {
    const user = userEvent.setup();
    renderWithIntl(<MobileMenu />);

    const toggle = screen.getByRole('button', { name: 'Open menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);

    const dialog = await screen.findByRole('dialog', { name: 'Menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Close menu' })).toHaveFocus());
    expect(screen.getByRole('link', { name: /Vision/ })).toHaveAttribute('aria-current', 'page');

    for (let i = 0; i < 14; i++) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(toggle).toHaveFocus();
  });
});

describe('LanguageSwitcher', () => {
  it('links to the same page in the other language', () => {
    renderWithIntl(<LanguageSwitcher />);
    const kn = screen.getByRole('link', { name: 'ಕನ್ನಡ' });
    expect(kn).toHaveAttribute('href', '/kn/vision');
    expect(kn).toHaveAttribute('lang', 'kn');
    expect(screen.getByText('English')).toHaveAttribute('aria-current', 'true');
  });
});
