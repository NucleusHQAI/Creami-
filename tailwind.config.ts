import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#fffaf2',
        paper: '#fffdf9',
        ink: '#232238',
        muted: '#686579',
        line: '#e9e2d7',
        berry: '#cf365f',
        berrydk: '#a62249',
        blue: '#385d8a',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      borderRadius: {
        recipe: '23px',
        panel: '25px',
        soft: '20px',
        pill: '99px',
      },
      boxShadow: {
        lift: '0 18px 50px rgba(55, 45, 35, 0.09)',
      },
      maxWidth: {
        content: '1240px',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(16px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
} satisfies Config
