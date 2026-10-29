import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { en } from '@/content/copy/en';
import { getPortrait } from '@/content';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Dr. Bhagavan B.C. — Vice Chancellor, Rajiv Gandhi University of Health Sciences, Karnataka';

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'kn' }];
}

/**
 * Social sharing image with the approved portrait. Rendered in Latin script
 * for both locales because the image renderer has no Kannada font bundled;
 * the page title and description shared alongside it are localised.
 */
export default async function OpenGraphImage() {
  const { profile } = en;
  const portrait = getPortrait();
  const photo = portrait
    ? `data:image/png;base64,${(await readFile(join(process.cwd(), 'public/images/portrait/og-cutout.png'))).toString('base64')}`
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          color: '#FFFFFF',
          background:
            'radial-gradient(50% 70% at 82% 40%, rgba(49,95,234,0.55), transparent 70%), linear-gradient(160deg, #06101f, #071426 50%, #0B1F3A)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 0 0 80px', width: 700 }}>
          <div style={{ display: 'flex', fontSize: 22, color: '#C9AD78', letterSpacing: 3, textTransform: 'uppercase' }}>
            {`${profile.role} · ${profile.institutionShort}`}
          </div>
          <div style={{ display: 'flex', fontSize: 72, fontWeight: 700, letterSpacing: -2, marginTop: 20, lineHeight: 1.05 }}>
            {profile.name}
          </div>
          <div style={{ display: 'flex', fontSize: 30, color: '#E4CD9C', marginTop: 18 }}>{profile.institution}</div>
          <div style={{ display: 'flex', fontSize: 22, color: '#A8B5C8', marginTop: 30 }}>{profile.qualificationsLine}</div>
        </div>
        {photo && (
          <div style={{ position: 'absolute', right: 30, bottom: 0, width: 520, height: 560, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div
              style={{
                position: 'absolute',
                left: 40,
                top: 40,
                width: 440,
                height: 440,
                borderRadius: 999,
                border: '2px solid rgba(201,173,120,0.7)',
              }}
            />
            <img src={photo} width={520} height={499} alt="" style={{ objectFit: 'contain' }} />
          </div>
        )}
      </div>
    ),
    size,
  );
}
