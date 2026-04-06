/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#8B5CF6',
          'purple-light': '#A78BFA',
          'purple-dark': '#6D28D9',
        },
        surface: {
          bg: 'var(--bg)',
          card: 'var(--card)',
          border: 'var(--border)',
          raised: 'var(--surface)',
        },
        content: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
