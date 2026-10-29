import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#071426',
        }}
      >
        <div
          style={{
            width: 136,
            height: 136,
            borderRadius: 999,
            border: '3px solid #C9AD78',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#F5F3EE',
            fontSize: 60,
            fontFamily: 'serif',
          }}
        >
          BC
        </div>
      </div>
    ),
    size,
  );
}
