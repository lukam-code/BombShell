import type { Config } from 'tailwindcss';

/** Boje dolaze iz CSS promenljivih (app/globals.css) – menjaj paletu tamo, na jednom mestu. */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        raised: 'rgb(var(--raised) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        gold: 'rgb(var(--gold) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 32px -4px rgb(var(--accent) / 0.45)',
        'glow-gold': '0 0 32px -4px rgb(var(--gold) / 0.5)',
      },
    },
  },
  plugins: [],
};
export default config;
