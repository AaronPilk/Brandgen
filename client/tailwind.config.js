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
          'purple-dark': '#7C3AED',
          'purple-deep': '#6D28D9',
          'purple-glow': 'rgba(139, 92, 246, 0.15)',
        },
        surface: {
          bg: 'var(--bg)',
          card: 'var(--card)',
          border: 'var(--border)',
          raised: 'var(--surface)',
          glass: 'var(--glass)',
        },
        content: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'system-ui',
          'sans-serif',
        ],
      },
      fontSize: {
        'display': ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.04em', fontWeight: '700' }],
        'headline': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '700' }],
        'title': ['1.75rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'glass': '0 0 0 1px var(--border), 0 2px 8px rgba(0,0,0,0.04)',
        'glass-lg': '0 0 0 1px var(--border), 0 8px 32px rgba(0,0,0,0.08)',
        'purple': '0 0 0 1px rgba(139,92,246,0.3), 0 4px 16px rgba(139,92,246,0.15)',
        'purple-lg': '0 0 0 1px rgba(139,92,246,0.3), 0 8px 32px rgba(139,92,246,0.2)',
        'elevated': '0 2px 4px rgba(0,0,0,0.02), 0 8px 24px rgba(0,0,0,0.06)',
        'elevated-lg': '0 4px 8px rgba(0,0,0,0.04), 0 16px 48px rgba(0,0,0,0.1)',
      },
      animation: {
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(139,92,246,0.1)' },
          '100%': { boxShadow: '0 0 40px rgba(139,92,246,0.25)' },
        },
      },
    },
  },
  plugins: [],
};
