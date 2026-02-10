/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Cinzel', 'Merriweather', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        'xs': '2px',
        '12': '12px',
      },
      colors: {
        'arcane-navy': '#0d1126',
        'arcane-glass': 'rgba(13, 17, 38, 0.7)',
      }
    },
  },
  plugins: [],
}
