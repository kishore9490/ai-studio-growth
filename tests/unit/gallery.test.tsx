import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Gallery } from '@/components/media/Gallery';
import { devPlaceholderMedia } from '@/content/placeholders';
import { renderWithIntl } from './test-utils';

const items = devPlaceholderMedia.slice(0, 3);

describe('Gallery lightbox', () => {
  it('opens a labelled dialog, navigates with arrow keys and closes with Escape, restoring focus', async () => {
    const user = userEvent.setup();
    renderWithIntl(<Gallery items={items} />);

    const triggers = screen.getAllByRole('button', { name: /Open image/ });
    expect(triggers).toHaveLength(3);
    await user.click(triggers[1]!);

    const dialog = await screen.findByRole('dialog', { name: 'Image viewer' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Image 2 of 3')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Close image viewer' })).toHaveFocus());

    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('Image 3 of 3')).toBeInTheDocument();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('Image 1 of 3')).toBeInTheDocument();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByText('Image 3 of 3')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(triggers[2]).toHaveFocus();
  });

  it('keeps Tab focus inside the open dialog', async () => {
    const user = userEvent.setup();
    renderWithIntl(<Gallery items={items} />);
    await user.click(screen.getAllByRole('button', { name: /Open image/ })[0]!);
    const dialog = await screen.findByRole('dialog');
    for (let i = 0; i < 5; i++) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it('gives every image meaningful alternative text in the dialog', async () => {
    const user = userEvent.setup();
    renderWithIntl(<Gallery items={items} />, 'kn');
    await user.click(screen.getAllByRole('button')[0]!);
    expect(await screen.findByAltText(items[0]!.alt.kn)).toBeInTheDocument();
  });
});
