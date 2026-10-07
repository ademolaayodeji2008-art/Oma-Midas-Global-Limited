/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4A1D4F',
        accent: '#C9A86A',
        blush: '#F4E1E6',
        background: '#FAF7F5',
        charcoal: '#2B2B2B',
        success: '#2E7D5B',
        warning: '#D9962B',
        error: '#B3392F',
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        card: '0 2px 16px rgba(74, 29, 79, 0.08)',
        hover: '0 4px 24px rgba(74, 29, 79, 0.16)',
      },
    },
  },
  plugins: [],
};
