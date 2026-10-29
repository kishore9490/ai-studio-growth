import { DM_Serif_Display, Inter, Manrope } from 'next/font/google';

// Fonts are downloaded at build time and self-hosted; no runtime requests to Google.
export const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
  weight: ['500', '600', '700', '800'],
});

export const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-serif',
  weight: '400',
  preload: false,
});

// Noto Sans Kannada is self-hosted from /public/fonts (SIL OFL 1.1) so that it
// can be preloaded on Kannada pages only. See globals.css and [locale]/layout.tsx.
export const KANNADA_FONT_URL = '/fonts/noto-sans-kannada-variable.woff2';

export const fontVariables = [inter.variable, manrope.variable, dmSerif.variable].join(' ');
