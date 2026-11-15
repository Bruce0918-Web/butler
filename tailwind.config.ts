import type { Config } from 'tailwindcss';

/**
 * The single source of design values (see DESIGN.md). `theme` is replaced, not extended,
 * so Tailwind's default scales do not exist in this project.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: { md: '768px', lg: '1100px', xl: '1280px' },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      bg: '#100f0d',
      surface: '#181714',
      raised: '#211f1b',
      line: '#2d2a25',
      text: '#ece7dc',
      muted: '#b5afa1',
      faint: '#8c8679',
      accent: '#c4a46c',
      'accent-ink': '#15130f',
    },
    spacing: { 0: '0', px: '1px', 1: '4px', 2: '8px', 3: '12px', 4: '16px', 6: '24px', 8: '32px', 12: '48px', 16: '64px', 24: '96px', nav: '224px' },
    maxWidth: { prose: '640px', page: '960px', wide: '1200px', full: '100%' },
    fontFamily: {
      serif: ['"Noto Serif SC"', '"Songti SC"', '"Source Han Serif SC"', 'serif'],
      sans: ['"Segoe UI"', '-apple-system', '"PingFang SC"', '"Microsoft YaHei UI"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      xs: ['12px', { lineHeight: '16px' }],
      sm: ['14px', { lineHeight: '20px' }],
      base: ['16px', { lineHeight: '26px' }],
      lg: ['20px', { lineHeight: '28px' }],
      xl: ['28px', { lineHeight: '36px' }],
      '2xl': ['40px', { lineHeight: '48px' }],
      '3xl': ['56px', { lineHeight: '64px' }],
    },
    fontWeight: { normal: '400', medium: '500', semibold: '600' },
    letterSpacing: { tight: '-0.01em', normal: '0', wide: '0.08em' },
    borderRadius: { none: '0', sm: '6px', md: '12px', full: '9999px' },
    borderWidth: { DEFAULT: '1px', 0: '0' },
    opacity: { 0: '0', 40: '0.4', 60: '0.6', 80: '0.8', 100: '1' },
    transitionDuration: { fast: '150ms', base: '200ms', slow: '300ms' },
    transitionTimingFunction: { out: 'cubic-bezier(0.2, 0.7, 0.2, 1)' },
  },
} satisfies Config;
