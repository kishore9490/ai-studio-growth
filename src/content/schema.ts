import { z } from 'zod';
import { mediaCategories, publicationTypes, sourceIds } from './ids';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected an ISO date (YYYY-MM-DD)');
const year = z.number().int().min(1950).max(2100);

export const verificationStatusSchema = z.enum([
  /** Checked directly against the cited source on `verifiedAt`. */
  'verified',
  /** Taken from the cited source but not yet re-checked by an editor. */
  'pending',
  /** Conflicts with another source or is ambiguous; must not be published until resolved. */
  'disputed',
]);
export type VerificationStatus = z.infer<typeof verificationStatusSchema>;

/** Editorial metadata shared by every factual record. Never rendered to visitors. */
export const factMetaSchema = z.object({
  sourceIds: z.array(z.enum(sourceIds)).min(1),
  verifiedAt: isoDate.nullable(),
  verificationStatus: verificationStatusSchema,
  published: z.boolean(),
  reviewNotes: z.array(z.string()).default([]),
});

export const sourceRecordSchema = z.object({
  id: z.enum(sourceIds),
  title: z.string().min(1),
  publisher: z.string().min(1),
  url: z.url(),
  kind: z.enum(['primary', 'official', 'secondary']),
  /** Date the source itself was last opened and read by an editor. */
  lastChecked: isoDate.nullable(),
  notes: z.string(),
});
export type SourceRecord = z.infer<typeof sourceRecordSchema>;

export const qualificationSchema = factMetaSchema.extend({
  id: z.string(),
  /** Credential exactly as written in the source. Never translated. */
  credential: z.string().min(1),
  startYear: year.nullable(),
  endYear: year,
});
export type Qualification = z.infer<typeof qualificationSchema>;

export const careerEndSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('year'), year }),
  /**
   * The source lists the role as "present". `presentConfirmed` must only be
   * set to true after an editor confirms the appointment is still current.
   */
  z.object({ kind: z.literal('open'), presentConfirmed: z.boolean() }),
]);

export const careerEntrySchema = factMetaSchema.extend({
  id: z.string(),
  /** Null when the source does not publish a start year. */
  startYear: year.nullable(),
  end: careerEndSchema,
  /** Groups entries held at the same institution. */
  institution: z.enum(['rguhs', 'kims']),
  isCurrentPrincipalRole: z.boolean().default(false),
});
export type CareerEntry = z.infer<typeof careerEntrySchema>;

export const publicationSchema = factMetaSchema.extend({
  id: z.string(),
  title: z.string().min(1),
  authors: z.array(z.string().min(1)).min(1),
  venue: z.string().min(1),
  year,
  type: z.enum(publicationTypes),
  doi: z.string().regex(/^10\.\d{4,9}\/\S+$/).optional(),
  isbn: z.string().regex(/^(97[89])?\d{9}[\dX]$/).optional(),
  url: z.url().optional(),
  description: z.string().optional(),
});
export type Publication = z.infer<typeof publicationSchema>;

export const mediaItemSchema = factMetaSchema.extend({
  id: z.string(),
  src: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.object({ en: z.string().min(1), kn: z.string().min(1) }),
  caption: z.object({ en: z.string(), kn: z.string() }).optional(),
  date: isoDate.optional(),
  category: z.enum(mediaCategories),
  /** Who holds the rights, and the permission reference. Required for every real asset. */
  credit: z.string().min(1),
  /** True only for development placeholders. Placeholders never render in production. */
  placeholder: z.boolean(),
});
export type MediaItem = z.infer<typeof mediaItemSchema>;

export const portraitSchema = z
  .object({
    src: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    credit: z.string().min(1),
    permissionReference: z.string().min(1),
  })
  .nullable();
export type Portrait = z.infer<typeof portraitSchema>;
