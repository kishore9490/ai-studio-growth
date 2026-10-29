export const pages = ['home', 'about', 'education', 'experience', 'vision', 'publications', 'media', 'contact'] as const;
export type PageKey = (typeof pages)[number];

/** Locale-independent pathnames. The locale prefix is added by next-intl. */
export const pagePaths: Record<PageKey, string> = {
  home: '/',
  about: '/about',
  education: '/education',
  experience: '/experience',
  vision: '/vision',
  publications: '/publications',
  media: '/media',
  contact: '/contact',
};

export type NavItem = { key: PageKey; href: string };
export type NavGroup = { group: 'journeyGroup' | 'archiveGroup'; items: NavItem[] };
export type NavEntry = NavItem | NavGroup;

const item = (key: PageKey): NavItem => ({ key, href: pagePaths[key] });

/** Grouped desktop navigation, keeping the top level to six entries. */
export const desktopNav: NavEntry[] = [
  item('home'),
  item('about'),
  { group: 'journeyGroup', items: [item('education'), item('experience')] },
  item('vision'),
  { group: 'archiveGroup', items: [item('publications'), item('media')] },
  item('contact'),
];

/** Flat navigation for the mobile menu and footer. */
export const flatNav: NavItem[] = pages.map(item);

export function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/' || pathname === '';
  return pathname === href || pathname.startsWith(`${href}/`);
}
