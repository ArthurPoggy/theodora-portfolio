import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0f0f0f',
          card: '#1a1a1a',
          hover: '#222222',
        },
        accent: {
          DEFAULT: '#b49cfd',
          light: '#cfc0fe',
          dark: '#9275e0',
        },
        pastel: '#f8c4ff',   // tom exato dos quadrados de public/bg.png
        foreground: {
          DEFAULT: '#f5feff',
          muted: '#a0a0a0',
        },
      },
      fontFamily: {
        display: ['Courier Prime', 'Courier New', 'monospace'],
        body: ['Patrick Hand', 'cursive', 'sans-serif'],
        mono: ['Courier Prime', 'monospace'],
      },
      animation: {
        'scroll-left': 'scrollLeft 30s linear infinite',
        'scroll-right': 'scrollRight 30s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
      },
      keyframes: {
        scrollLeft: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        scrollRight: {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
