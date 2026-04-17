/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'Cinzel', 'EB Garamond', 'Georgia', 'serif'],
        body: ['Inter Tight', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'Menlo', 'monospace'],
        serif: ['Cinzel', 'Merriweather', 'serif'],
        sans: ['Inter Tight', 'Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        'xs': '2px',
        '12': '12px',
      },
      colors: {
        'arcane-navy': '#0E0B1F',
        'arcane-glass': 'rgba(23, 19, 46, 0.7)',
        // Lorelich theme tokens — use these as text/bg-lr-*
        lr: {
          bg: 'var(--bg)',
          surface: 'var(--surface)',
          'surface-hi': 'var(--surface-hi)',
          line: 'var(--line)',
          'line-strong': 'var(--line-strong)',
          primary: 'var(--primary)',
          'primary-soft': 'var(--primary-soft)',
          accent: 'var(--accent)',
          'accent-soft': 'var(--accent-soft)',
          fear: 'var(--fear)',
          text: 'var(--text)',
          'text-muted': 'var(--text-muted)',
          'text-dim': 'var(--text-dim)',
          danger: 'var(--danger)',
          success: 'var(--success)',
          info: 'var(--info)',
        },
      },
      screens: {
        lr: { max: '900px' },
        desk: { min: '901px' },
      },
    },
  },
  plugins: [],
}
