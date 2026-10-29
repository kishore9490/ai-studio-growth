import { ImageResponse } from 'next/og';
import { en } from '@/content/copy/en';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Dr. Bhagavan B.C. — Vice Chancellor, Rajiv Gandhi University of Health Sciences, Karnataka';

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'kn' }];
}

/**
 * Social sharing image. Rendered in Latin script for both locales because
 * the image renderer has no Kannada font bundled; the page title and
 * description shared alongside it are localised.
 */
export default function OpenGraphImage() {
  const { profile } = en;
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          color: '#FFFFFF',
          background:
            'radial-gradient(60% 70% at 85% 20%, rgba(49,95,234,0.45), transparent 70%), linear-gradient(180deg, #071426, #0B1F3A)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 999,
              border: '2px solid #C9AD78',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              fontFamily: 'serif',
              color: '#F5F3EE',
            }}
          >
            BC
          </div>
          <div style={{ width: 80, height: 2, background: '#C9AD78' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -2 }}>{profile.name}</div>
          <div style={{ fontSize: 34, color: '#C9AD78', marginTop: 16 }}>
            {`${profile.role}, ${profile.institution}`}
          </div>
          <div style={{ fontSize: 24, color: '#A8B5C8', marginTop: 28 }}>{profile.qualificationsLine}</div>
        </div>
      </div>
    ),
    size,
  );
}
