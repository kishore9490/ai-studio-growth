import type { AboutSectionId, CareerId, FocusAreaId, QualificationId, VisionId } from '../ids';

export interface ProfileCopy {
  /** Name as it should appear in this locale. Kannada rendering requires reviewer approval. */
  name: string;
  /** Short role line, e.g. "Vice Chancellor". */
  role: string;
  institution: string;
  institutionShort: string;
  region: string;
  /** Credentials joined for display. Abbreviations remain in English. */
  qualificationsLine: string;
}

export interface QualificationCopy {
  /** Credential label as shown to visitors. Abbreviations are not translated. */
  title: string;
  /** Plain-language description of the credential. */
  detail: string;
  institution: string | null;
}

export interface CareerCopy {
  role: string;
  institution: string;
  /** Short factual description. Only what the source supports. */
  description: string;
}

export interface FocusAreaCopy {
  title: string;
  body: string;
}

export interface VisionCopy {
  title: string;
  /** One-line summary of the stated priority. */
  summary: string;
  /** Editorial context explaining the priority. Not a report of implementation. */
  context: string;
}

export interface AboutSectionCopy {
  heading: string;
  paragraphs: string[];
}

export interface LocaleCopy {
  profile: ProfileCopy;
  qualifications: Record<QualificationId, QualificationCopy>;
  career: Record<CareerId, CareerCopy>;
  focusAreas: Record<FocusAreaId, FocusAreaCopy>;
  vision: Record<VisionId, VisionCopy>;
  about: Record<AboutSectionId, AboutSectionCopy>;
}
