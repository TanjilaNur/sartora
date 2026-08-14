/**
 * All brand tokens here are sourced from .pipeline/design-system.md — that
 * file is the single place to look when rebranding; every value here should
 * match it exactly. `page`/`surface`/`textPrimary`/`textSecondary`/`border`/
 * `primaryTint`/`onPrimaryTint`/`success`/`danger`/`warning` are theme-aware
 * (swap between light/dark via the CSS variables in src/index.css) —
 * success/danger/warning need a darker shade in light mode to stay readable
 * as small text on a white card; `primary`/`secondary` stay truly constant.
 */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#660033',
          light: '#EBDEE4',
        },
        secondary: '#E60073',
        success: 'var(--color-success)',
        danger: 'var(--color-danger)',
        warning: 'var(--color-warning)',
        neutral: {
          900: '#111827',
          600: '#4B5563',
          300: '#D1D5DB',
          100: '#F3F4F6',
        },
        page: 'var(--color-page)',
        surface: 'var(--color-surface)',
        textPrimary: 'var(--color-text-primary)',
        textSecondary: 'var(--color-text-secondary)',
        border: 'var(--color-border)',
        primaryTint: 'var(--color-primary-tint)',
        onPrimaryTint: 'var(--color-on-primary-tint)',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        modal: '0 10px 25px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [],
};
