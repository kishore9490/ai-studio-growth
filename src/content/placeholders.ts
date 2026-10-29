import type { MediaItem } from './schema';

/**
 * DEVELOPMENT PLACEHOLDERS ONLY. Abstract graphics, not photographs of any
 * person or event. Rendered only when SHOW_DEV_PLACEHOLDERS=true, so the
 * gallery and lightbox can be exercised before approved media exists.
 */
const categories = [
  'academic-engagements',
  'university-events',
  'conferences-lectures',
  'convocations',
  'community-initiatives',
  'interviews-coverage',
] as const;

export const devPlaceholderMedia: MediaItem[] = categories.map((category, index) => ({
  id: `placeholder-${index + 1}`,
  src: `/placeholders/media-${(index % 3) + 1}.svg`,
  width: 1200,
  height: index % 2 === 0 ? 900 : 1500,
  alt: {
    en: `Development placeholder ${index + 1}: abstract graphic, not a photograph`,
    kn: `ಅಭಿವೃದ್ಧಿ ಪ್ಲೇಸ್‌ಹೋಲ್ಡರ್ ${index + 1}: ಅಮೂರ್ತ ಚಿತ್ರ, ಛಾಯಾಚಿತ್ರವಲ್ಲ`,
  },
  caption: {
    en: 'Development placeholder — awaiting an approved photograph',
    kn: 'ಅಭಿವೃದ್ಧಿ ಪ್ಲೇಸ್‌ಹೋಲ್ಡರ್ — ಅನುಮೋದಿತ ಛಾಯಾಚಿತ್ರಕ್ಕಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ',
  },
  category,
  credit: 'Development placeholder',
  placeholder: true,
  sourceIds: ['rguhs-home'],
  verifiedAt: null,
  verificationStatus: 'pending',
  published: false,
  reviewNotes: ['Placeholder. Replace with an authorised asset.'],
}));
