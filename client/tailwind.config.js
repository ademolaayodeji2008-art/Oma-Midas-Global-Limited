/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary:     '#2D1B69',
        accent:      '#C9A86A',
        accentLight: '#E8C98A',
        sidebarBg:   '#1E1433',
        sidebarText: '#F5F0FF',
        sectionBg:   '#F8F5FF',
        background:  '#F5F3FF',
        charcoal:    '#1A1A2E',
        success:     '#16A34A',
        warning:     '#D97706',
        error:       '#DC2626',
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
        card:  '0 2px 16px rgba(45,27,105,0.08)',
        hover: '0 4px 24px rgba(45,27,105,0.16)',
      },
    },
  },
  plugins: [],
};
