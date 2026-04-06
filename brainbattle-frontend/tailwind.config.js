/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#7C3AED',
          blue:   '#3B82F6',
          yellow: '#F59E0B',
          green:  '#10B981',
          red:    '#EF4444',
        }
      }
    },
  },
  plugins: [],
}
