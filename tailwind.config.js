/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        glass: {
          white: 'var(--glass-white)',
          border: 'var(--glass-border)',
          hover: 'var(--glass-hover)',
        },
        accent: {
          primary: 'var(--accent-primary)',
          secondary: 'var(--accent-secondary)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
      },
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glass: 'var(--shadow-glass)',
        glow: '0 0 24px var(--accent-glow)',
      },
      backdropBlur: {
        glass: '24px',
      },
      borderRadius: {
        glass: '20px',
      },
      backgroundImage: {
        base: 'var(--bg-base)',
        'hero-fade': 'linear-gradient(180deg, rgba(0,0,0,0.02), rgba(4,6,17,0.82))',
        'coral-gradient': 'linear-gradient(135deg, #f4a259 0%, #ef7f1a 55%, #b45309 100%)',
      },
    },
  },
  plugins: [],
};
