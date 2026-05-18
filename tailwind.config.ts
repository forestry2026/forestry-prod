import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        terracotta: {
          DEFAULT: '#B35C2A',
          dark:    '#8B4520',
          light:   '#D4784A',
          50:      '#FDF4EF',
          100:     '#FAE3D3',
          200:     '#F5C4A0',
          300:     '#EEA06D',
          400:     '#D4784A',
          500:     '#B35C2A',
          600:     '#8B4520',
          700:     '#6A3318',
          800:     '#4A2410',
          900:     '#2D160A',
        },
        sage: {
          DEFAULT: '#87A878',
          dark:    '#5A7A50',
          light:   '#A3C094',
          50:      '#F2F7F0',
          100:     '#DDECD8',
          200:     '#BFCFBA',
          300:     '#A3C094',
          400:     '#87A878',
          500:     '#6B9264',
          600:     '#5A7A50',
          700:     '#44603C',
        },
        charcoal: {
          DEFAULT: '#2D3436',
          light:   '#3D4446',
          50:      '#F4F5F5',
          100:     '#E0E3E3',
          200:     '#B8BEBE',
          300:     '#8F9898',
          400:     '#636E6F',
          500:     '#3D4446',
          600:     '#2D3436',
          700:     '#1E2324',
          800:     '#111819',
          900:     '#060809',
        },
        cream: {
          DEFAULT: '#FAF7F2',
          dark:    '#F0EBE1',
          darker:  '#E5DDD0',
        },
      },
      fontFamily: {
        heading: ['var(--font-zilla-slab)', 'Georgia', 'serif'],
        body:    ['var(--font-dm-sans)', '-apple-system', 'sans-serif'],
        sans:    ['var(--font-dm-sans)', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'warm-sm': '0 2px 8px rgba(179, 92, 42, 0.12)',
        'warm':    '0 4px 24px rgba(179, 92, 42, 0.15)',
        'warm-lg': '0 8px 40px rgba(179, 92, 42, 0.2)',
        'card':    '0 4px 24px rgba(28, 28, 28, 0.06)',
        'card-lg': '0 12px 48px rgba(28, 28, 28, 0.1)',
      },
      animation: {
        'fade-up':   'fadeUp 0.6s ease forwards',
        'fade-in':   'fadeIn 0.4s ease forwards',
        'float':     'float 4s ease-in-out infinite',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.6', transform: 'scale(0.8)' },
        },
      },
      backgroundImage: {
        'dot-grid': 'radial-gradient(circle, rgba(179,92,42,0.12) 1px, transparent 1px)',
      },
      backgroundSize: {
        'dot-grid': '32px 32px',
      },
    },
  },
  plugins: [],
}

export default config
