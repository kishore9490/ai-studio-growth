/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f2f5fa',
          100: '#e2e8f4',
          200: '#c6d2e8',
          300: '#9db1d6',
          400: '#6d88bf',
          500: '#4a67a6',
          600: '#374f89',
          700: '#2c3f6f',
          800: '#1c2a4d',
          900: '#0f1c36',
          950: '#0a1425',
        },
        brand: {
          50: '#eff5ff',
          100: '#dbe8fe',
          200: '#bfd7fe',
          300: '#93bcfd',
          400: '#6098fa',
          500: '#3b76f6',
          600: '#2559eb',
          700: '#1d45d8',
          800: '#1e3aaf',
          900: '#1e358a',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 28 54 / 0.06), 0 1px 3px 0 rgb(15 28 54 / 0.04)',
        panel: '0 8px 24px -8px rgb(15 28 54 / 0.18)',
      },
      borderRadius: {
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 160ms ease-out',
        'slide-up': 'slide-up 200ms ease-out',
      },
    },
  },
  plugins: [],
};
