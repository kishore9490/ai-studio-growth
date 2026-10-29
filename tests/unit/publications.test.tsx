import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { FILTER_THRESHOLD, PublicationList } from '@/components/publications/PublicationList';
import type { Publication } from '@/content/schema';
import { renderWithIntl } from './test-utils';

/** Synthetic fixtures for component behaviour only — never published content. */
const fixture = (i: number, type: Publication['type'], year: number): Publication => ({
  id: `fixture-${i}`,
  title: `Test record ${i}`,
  authors: ['Author A'],
  venue: 'Test venue',
  year,
  type,
  url: 'https://example.org/record',
  sourceIds: ['rguhs-home'],
  verifiedAt: null,
  verificationStatus: 'pending',
  published: false,
  reviewNotes: [],
});

describe('PublicationList', () => {
  it('hides filters when there are few records', () => {
    renderWithIntl(<PublicationList items={[fixture(1, 'book', 2020)]} />);
    expect(screen.queryByLabelText('Type')).not.toBeInTheDocument();
    expect(screen.getByText('Test record 1')).toBeInTheDocument();
  });

  it('filters by type and year and announces the result count', async () => {
    const user = userEvent.setup();
    const items = Array.from({ length: FILTER_THRESHOLD }, (_, i) =>
      fixture(i, i % 2 ? 'research-paper' : 'lecture', 2020 + (i % 3)),
    );
    renderWithIntl(<PublicationList items={items} />);

    await user.selectOptions(screen.getByLabelText('Type'), 'lecture');
    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByRole('status')).toHaveTextContent('3 records');

    await user.selectOptions(screen.getByLabelText('Year'), '2020');
    expect(within(list).getAllByRole('listitem')).toHaveLength(1);
  });
});
