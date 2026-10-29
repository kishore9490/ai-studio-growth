import type { CSSProperties } from 'react';

const fade =
  'linear-gradient(to bottom, #000 72%, transparent 98%), linear-gradient(to right, transparent 0%, #000 16%, #000 84%, transparent 100%)';

/** Fades the cut-out photograph's cropped shoulders and lower edge into its backdrop. */
export const portraitMask: CSSProperties = {
  maskImage: fade,
  maskComposite: 'intersect',
  WebkitMaskImage: fade,
  WebkitMaskComposite: 'source-in',
};
