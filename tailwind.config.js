/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00b2a6',
          50: '#e6f7f5',
          100: '#ccefeb',
          200: '#99dfd7',
          300: '#66cfc3',
          400: '#33bfaf',
          500: '#00b2a6',
          600: '#009688',
          700: '#00796b',
          800: '#005d4e',
          900: '#004231'
        },
        secondary: {
          DEFAULT: '#333333',
          50: '#F5F5F5',
          100: '#E0E0E0',
          200: '#BDBDBD',
          300: '#9E9E9E',
          400: '#757575',
          500: '#333333',
          600: '#2B2B2B',
          700: '#232323',
          800: '#1A1A1A',
          900: '#121212'
        }
      }
    }
  },
  plugins: []
}
