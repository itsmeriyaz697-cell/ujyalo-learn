/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dbe6ff',
          200: '#bdd0ff',
          300: '#92b0ff',
          400: '#6087fb',
          500: '#3b61f0',
          600: '#2947d6',
          700: '#1f36ab',
          800: '#1b2f86',
          900: '#15245f',
          950: '#0d173b',
        },
        gold: {
          50: '#fff9e8',
          100: '#fff1c6',
          200: '#ffe28b',
          300: '#ffd05a',
          400: '#f7b733',
          500: '#e29a1f',
          600: '#b97716',
          700: '#8f5914',
        },
        paper: '#f6f8fc',
        ink: '#0b1b3a',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -12px rgba(15, 23, 42, 0.12)',
        lift: '0 18px 40px -20px rgba(15, 23, 42, 0.35)',
      },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem' },
      keyframes: {
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(6px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        'pulse-soft': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.45 } },
      },
      animation: {
        'fade-up': 'fade-up 220ms ease-out both',
        'pulse-soft': 'pulse-soft 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
