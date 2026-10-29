export const locales = ['en', 'kn'] as const;
export const pages = ['', '/about', '/education', '/experience', '/vision', '/publications', '/media', '/contact'] as const;
export const allPaths = locales.flatMap((l) => pages.map((p) => `/${l}${p}`));
export const widths = [320, 375, 430, 768, 1024, 1440, 1920] as const;
