/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#101A2E',
        slate1: '#3D4A63',
        paper: '#EEF1F6',
        card: '#FFFFFF',
        ai: '#1F4FD8',
        seal: '#D6362F',
        leaf: '#0E9E6E',
        amber1: '#E08A00',
        line1: '#D7DDE8',
      },
      fontFamily: {
        display: ['"Zen Kaku Gothic New"', 'system-ui', 'sans-serif'],
        body: ['"Noto Sans JP"', 'system-ui', 'sans-serif'],
        num: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,26,46,.06), 0 8px 24px -12px rgba(16,26,46,.18)',
        seal: '0 0 0 3px rgba(214,54,47,.12)',
      },
      keyframes: {
        pop: { '0%': { transform: 'scale(.94)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        slideup: { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        stamp: { '0%': { transform: 'scale(1.6) rotate(-14deg)', opacity: '0' }, '60%': { transform: 'scale(.94) rotate(-8deg)', opacity: '1' }, '100%': { transform: 'scale(1) rotate(-8deg)', opacity: '1' } },
      },
      animation: {
        pop: 'pop .18s ease-out',
        slideup: 'slideup .25s ease-out',
        stamp: 'stamp .45s cubic-bezier(.2,.9,.3,1.2)',
      },
    },
  },
  plugins: [],
}
