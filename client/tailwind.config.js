/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-navy': '#1E293B',
        'brand-blue': '#2563EB',
        'brand-blue-hover': '#1D4ED8',
        'bg-main': '#F8FAFC',
        'bg-card': '#FFFFFF',
        'table-header': '#334155',
        'text-primary': '#0F172A',
        'text-secondary': '#64748B',
        'text-light': '#94A3B8',
        'border-soft': '#E2E8F0',
        'divider-soft': '#CBD5E1',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      fontSize: {
        'page-title': '20px',
        'section-title': '14px',
        'table-header': '13px',
        'body-text': '13px',
        'small-text': '12px',
      },
    },
  },
  plugins: [],
}