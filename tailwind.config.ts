import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf8f0',
          100: '#f9edda',
          200: '#f2d8b0',
          300: '#e8bb7a',
          400: '#dc9a45',
          500: '#c97d2b',
          600: '#b06320',
          700: '#8f4d1d',
          800: '#743f1e',
          900: '#60351c',
        },
        cream: {
          50: '#fefdfb',
          100: '#fdf9f3',
          200: '#f9f0e3',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
