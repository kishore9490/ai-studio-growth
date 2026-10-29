import { z } from 'zod';
import { sourceRecordSchema, type SourceRecord } from './schema';
import type { SourceId } from './ids';

/**
 * Source register. Every factual record on the site cites one or more of
 * these entries. See docs/SOURCE_REGISTER.md for the human-readable register
 * and the audit log.
 */
const records = [
  {
    id: 'rguhs-vc-profile',
    title: 'Vice Chancellor profile',
    publisher: 'Rajiv Gandhi University of Health Sciences, Karnataka',
    url: 'https://www.rguhs.ac.in/vcprofile.html',
    kind: 'primary',
    lastChecked: null,
    notes:
      'Primary source for biography, qualifications, experience and stated priorities. ' +
      'Facts were transcribed from the commissioning brief, which quotes this page. ' +
      'A direct fetch on 2026-10-29 was blocked by the build environment network policy, ' +
      'so every record citing this source remains "pending" until an editor re-checks the live page.',
  },
  {
    id: 'rguhs-vc-desk',
    title: "From the Vice Chancellor's desk",
    publisher: 'Rajiv Gandhi University of Health Sciences, Karnataka',
    url: 'https://www.rguhs.ac.in/vcdesk.html',
    kind: 'official',
    lastChecked: null,
    notes:
      "Official welcome message. Linked, not quoted. No first-person text from this page is reproduced on the site.",
  },
  {
    id: 'rguhs-home',
    title: 'Rajiv Gandhi University of Health Sciences — official website',
    publisher: 'Rajiv Gandhi University of Health Sciences, Karnataka',
    url: 'https://www.rguhs.ac.in/',
    kind: 'official',
    lastChecked: null,
    notes: 'Official university website. Linked for institutional context only.',
  },
  {
    id: 'press-appointment-report',
    title: 'News report of the Vice Chancellor appointment (Medical Dialogues)',
    publisher: 'Medical Dialogues',
    url: 'https://medicaldialogues.in/news/health/doctors/kims-principal-dr-bc-bhagawan-appointed-as-new-rguhs-vc-144248',
    kind: 'secondary',
    lastChecked: null,
    notes:
      'Secondary corroboration only. Seen as a search-engine result on 2026-10-29; the article itself could not be opened. ' +
      'Uses the spelling "Bhagawan". Not used as evidence for any published fact.',
  },
] satisfies SourceRecord[];

export const sources: Record<SourceId, SourceRecord> = Object.fromEntries(
  z.array(sourceRecordSchema).parse(records).map((record) => [record.id, record]),
) as Record<SourceId, SourceRecord>;

export const officialLinks = {
  vcProfile: sources['rguhs-vc-profile'].url,
  vcDesk: sources['rguhs-vc-desk'].url,
  university: sources['rguhs-home'].url,
} as const;
