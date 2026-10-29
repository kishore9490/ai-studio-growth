/**
 * Stable identifiers for every content record. Locale copy files are typed
 * against these lists, so a missing translation is a compile-time error.
 */
export const qualificationIds = ['mbbs', 'ms-general-surgery', 'fmas', 'frcs-edinburgh', 'frcs-glasgow'] as const;
export type QualificationId = (typeof qualificationIds)[number];

export const careerIds = [
  'vice-chancellor-rguhs',
  'principal-kims',
  'hod-surgery-kims',
  'vice-principal-kims',
  'faculty-kims',
] as const;
export type CareerId = (typeof careerIds)[number];

export const focusAreaIds = [
  'medical-education',
  'academic-governance',
  'surgical-practice',
  'interdisciplinary-research',
  'technology-enabled-education',
  'community-health',
] as const;
export type FocusAreaId = (typeof focusAreaIds)[number];

export const visionIds = [
  'smart-campuses',
  'translational-research',
  'international-collaboration',
  'rural-outreach',
  'emerging-technologies',
  'affordable-access',
  'student-centred-learning',
] as const;
export type VisionId = (typeof visionIds)[number];

export const aboutSectionIds = [
  'introduction',
  'identity',
  'journey',
  'surgical-teaching',
  'leadership',
  'philosophy',
  'community',
  'milestones',
  'official-profile',
] as const;
export type AboutSectionId = (typeof aboutSectionIds)[number];

export const sourceIds = ['rguhs-vc-profile', 'rguhs-vc-desk', 'rguhs-home', 'press-appointment-report'] as const;
export type SourceId = (typeof sourceIds)[number];

export const publicationTypes = [
  'book',
  'book-chapter',
  'research-paper',
  'conference',
  'lecture',
  'editorial',
  'public-talk',
] as const;
export type PublicationType = (typeof publicationTypes)[number];

export const mediaCategories = [
  'academic-engagements',
  'university-events',
  'conferences-lectures',
  'convocations',
  'community-initiatives',
  'interviews-coverage',
] as const;
export type MediaCategory = (typeof mediaCategories)[number];
