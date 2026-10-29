import { describe, expect, it } from 'vitest';
import { careerEntries, mediaItems, portrait, publications, qualifications } from '@/content/records';
import { sources } from '@/content/sources';

/**
 * Pre-publication gate. Run with `npm run content:gate` before go-live.
 * It is EXPECTED TO FAIL until an editor has re-checked every published fact
 * against its source and recorded `verificationStatus: 'verified'` and a
 * `verifiedAt` date. Skipped in the normal test run.
 */
const gate = process.env.CONTENT_GATE === '1' ? describe : describe.skip;

gate('publication gate', () => {
  const published = [...qualifications, ...careerEntries, ...publications, ...mediaItems].filter((r) => r.published);

  it('every published fact is verified with a date', () => {
    const unverified = published.filter((r) => r.verificationStatus !== 'verified' || !r.verifiedAt).map((r) => r.id);
    expect(unverified, 'Unverified published records').toEqual([]);
  });

  it('every cited source has been checked', () => {
    const cited = new Set(published.flatMap((r) => r.sourceIds));
    const unchecked = [...cited].filter((id) => !sources[id].lastChecked);
    expect(unchecked, 'Sources never checked').toEqual([]);
  });

  it('no published media is a placeholder', () => {
    expect(mediaItems.filter((m) => m.published && m.placeholder)).toEqual([]);
  });

  it('site configuration is production-ready', () => {
    expect(process.env.SHOW_DEV_PLACEHOLDERS ?? 'false').toBe('false');
    expect(process.env.SITE_NOINDEX, 'Set SITE_NOINDEX=false for the approved production build').toBe('false');
    expect(process.env.NEXT_PUBLIC_SITE_URL ?? '', 'Set the production domain').toMatch(/^https:\/\//);
  });

  it('records whether an approved portrait exists (informational)', () => {
    // A missing portrait is allowed: the typographic composition is shown instead.
    expect(portrait === null || portrait.permissionReference.length > 0).toBe(true);
  });
});
