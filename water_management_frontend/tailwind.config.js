/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d6fe',
          300: '#a4b8fc',
          400: '#7b92f8',
          500: '#5468f1',
          600: '#3d47e5',
          700: '#3236ca',
          800: '#2a2da3',
          900: '#1a1f6b',
          950: '#0f1240',
        },
        gold: {
          50: '#fffbeb',
          100: '#fff3c4',
          200: '#ffe583',
          300: '#ffd54a',
          400: '#ffc220',
          500: '#f9a007',
          600: '#dd7602',
          700: '#b75306',
          800: '#943f0c',
          900: '#7a340d',
          950: '#461a03',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}