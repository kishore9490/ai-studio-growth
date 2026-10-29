import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z
    .url()
    .default('http://localhost:3000')
    .transform((url) => url.replace(/\/+$/, '')),
  SHOW_DEV_PLACEHOLDERS: z.enum(['true', 'false']).default('false'),
  SITE_NOINDEX: z.enum(['true', 'false']).default('true'),
});

const env = envSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  SHOW_DEV_PLACEHOLDERS: process.env.SHOW_DEV_PLACEHOLDERS || undefined,
  SITE_NOINDEX: process.env.SITE_NOINDEX || undefined,
});

export const siteConfig = {
  url: env.NEXT_PUBLIC_SITE_URL,
  showDevPlaceholders: env.SHOW_DEV_PLACEHOLDERS === 'true',
  noIndex: env.SITE_NOINDEX === 'true',
} as const;
