import { z } from 'zod';
import type { CareerId, QualificationId } from './ids';
import {
  careerEntrySchema,
  mediaItemSchema,
  portraitSchema,
  publicationSchema,
  qualificationSchema,
  type CareerEntry,
  type MediaItem,
  type Portrait,
  type Publication,
  type Qualification,
} from './schema';

/*
 * Language-neutral factual records. Localised labels for each record live in
 * src/content/copy/{en,kn}.ts and are keyed by the same id.
 *
 * Every record is "pending": the facts come from the official RGUHS profile as
 * quoted in the commissioning brief, but the live page could not be re-read
 * from the build environment. Run `npm run content:gate` before publication.
 */

type FactMeta = Pick<Qualification, 'sourceIds' | 'verifiedAt' | 'verificationStatus' | 'published' | 'reviewNotes'>;

/** Default metadata for facts taken from the official profile and not yet re-checked. */
const fromOfficialProfile: FactMeta = {
  sourceIds: ['rguhs-vc-profile'],
  verifiedAt: null,
  verificationStatus: 'pending',
  published: true,
  reviewNotes: [],
};

type QualificationInput = Omit<Qualification, keyof FactMeta | 'id'> & { id: QualificationId; reviewNotes?: string[] };
type CareerInput = Omit<CareerEntry, keyof FactMeta | 'id' | 'isCurrentPrincipalRole'> & {
  id: CareerId;
  isCurrentPrincipalRole?: boolean;
  reviewNotes?: string[];
};

const qualification = (input: QualificationInput) => ({ ...fromOfficialProfile, ...input, reviewNotes: input.reviewNotes ?? [] });
const career = (input: CareerInput) => ({
  ...fromOfficialProfile,
  ...input,
  isCurrentPrincipalRole: input.isCurrentPrincipalRole ?? false,
  reviewNotes: input.reviewNotes ?? [],
});

const qualificationRecords = [
  qualification({ id: 'mbbs', credential: 'MBBS', startYear: 1982, endYear: 1987 }),
  qualification({ id: 'ms-general-surgery', credential: 'M.S. (General Surgery)', startYear: 1991, endYear: 1993 }),
  qualification({
    id: 'fmas',
    credential: 'FMAS',
    startYear: null,
    endYear: 2016,
    reviewNotes: ['Awarding body is not named in the source. Do not add one without evidence.'],
  }),
  qualification({ id: 'frcs-edinburgh', credential: 'FRCS (Edinburgh)', startYear: null, endYear: 2022 }),
  qualification({ id: 'frcs-glasgow', credential: 'FRCS (Glasgow)', startYear: null, endYear: 2024 }),
];

const careerRecords = [
  career({
    id: 'vice-chancellor-rguhs',
    institution: 'rguhs',
    startYear: null,
    end: { kind: 'open', presentConfirmed: true },
    isCurrentPrincipalRole: true,
    reviewNotes: [
      'Current role per the official profile and the site brief.',
      'Start date is not published in the brief. A secondary news report suggests 2025; confirm from an official notification before adding a year.',
    ],
  }),
  career({
    id: 'principal-kims',
    institution: 'kims',
    startYear: 2023,
    end: { kind: 'open', presentConfirmed: false },
    reviewNotes: [
      'Source lists "2023–present". Given the Vice Chancellor appointment, confirm whether this appointment is still current. Rendered as "From 2023" until confirmed.',
    ],
  }),
  career({ id: 'hod-surgery-kims', institution: 'kims', startYear: 2022, end: { kind: 'year', year: 2023 } }),
  career({ id: 'vice-principal-kims', institution: 'kims', startYear: 2017, end: { kind: 'year', year: 2023 } }),
  career({
    id: 'faculty-kims',
    institution: 'kims',
    startYear: 2003,
    end: { kind: 'open', presentConfirmed: false },
    reviewNotes: [
      'Source combines "Professor and Associate Professor" in one entry for 2003–present. The individual periods for each rank are not published. Do not split without evidence.',
    ],
  }),
];

/**
 * Bibliographic records. Intentionally empty: no publication has yet been
 * independently verified. Add records only with a DOI, ISBN or official URL.
 */
const publicationRecords: Publication[] = [];

/** Approved photographs and videos. Intentionally empty until assets are authorised. */
const mediaRecords: MediaItem[] = [];

/**
 * Official portrait. Null until an authorised image and its usage permission
 * are supplied. A typographic composition is rendered instead — never a
 * generated likeness or a stock photograph.
 */
const portraitRecord: Portrait = null;

export const qualifications = z.array(qualificationSchema).parse(qualificationRecords) as (Qualification & {
  id: QualificationId;
})[];
export const careerEntries = z.array(careerEntrySchema).parse(careerRecords) as (CareerEntry & { id: CareerId })[];
export const publications = z.array(publicationSchema).parse(publicationRecords);
export const mediaItems = z.array(mediaItemSchema).parse(mediaRecords);
export const portrait = portraitSchema.parse(portraitRecord);
