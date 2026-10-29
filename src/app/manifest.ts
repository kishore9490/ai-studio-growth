import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Dr. Bhagavan B.C.',
    short_name: 'Dr. Bhagavan B.C.',
    start_url: '/en',
    display: 'browser',
    background_color: '#071426',
    theme_color: '#071426',
    icons: [
      { src: '/icon.svg', type: 'image/svg+xml', sizes: 'any' },
      { src: '/apple-icon', type: 'image/png', sizes: '180x180' },
    ],
  };
}
