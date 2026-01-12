/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors
        primary: {
          DEFAULT: '#261A54', // Primary Deep Indigo
          deep: '#261A54',
        },
        secondary: {
          DEFAULT: '#345EBE', // Secondary Blue
        },
        // Supporting Neutrals
        'dark-text': '#0F172A',
        'muted-text': '#475569',
        'border-gray': '#E5E7EB',
        'bg-light': '#F8FAFC',
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'app-title': ['28px', { lineHeight: '1.2', fontWeight: '700' }],
        'section-header': ['20px', { lineHeight: '1.3', fontWeight: '700' }],
        'card-title': ['16px', { lineHeight: '1.4', fontWeight: '600' }],
        'body': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      borderRadius: {
        'button': '10px',
        'button-lg': '12px',
      },
    },
  },
  plugins: [],
}

