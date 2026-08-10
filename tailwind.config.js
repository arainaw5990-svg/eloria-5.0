/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          50: '#f6f6f7',
          100: '#e1e1e3',
          200: '#c2c2c6',
          300: '#9a9aa1',
          400: '#6e6e76',
          500: '#4a4a52',
          600: '#36363c',
          700: '#25252b',
          800: '#18181c',
          900: '#0a0a0a',
          950: '#050506',
        },
        gold: {
          50: '#fbf7ed',
          100: '#f5edd3',
          200: '#ebd9a5',
          300: '#dfbf6e',
          400: '#c99a3a',
          500: '#b8842a',
          600: '#a3711f',
          700: '#85591b',
          800: '#6e491c',
          900: '#5d3e1b',
        },
      },
    },
  },
  plugins: [],
};
