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
          DEFAULT: '#FF6B00',
          50: '#FFE5D5',
          100: '#FFD4B8',
          200: '#FFB280',
          300: '#FF9048',
          400: '#FF6E10',
          500: '#FF6B00',
          600: '#D65700',
          700: '#AD4700',
          800: '#853700',
          900: '#5C2700'
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
