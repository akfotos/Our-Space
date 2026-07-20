/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        white: 'rgb(var(--color-white) / <alpha-value>)',
        rose: {
          50: 'rgb(var(--color-rose-50) / <alpha-value>)',
          100: 'rgb(var(--color-rose-100) / <alpha-value>)',
          200: 'rgb(var(--color-rose-200) / <alpha-value>)',
          300: 'rgb(var(--color-rose-300) / <alpha-value>)',
          400: 'rgb(var(--color-rose-400) / <alpha-value>)',
          500: 'rgb(var(--color-rose-500) / <alpha-value>)',
          600: 'rgb(var(--color-rose-600) / <alpha-value>)',
          700: 'rgb(var(--color-rose-700) / <alpha-value>)',
          800: 'rgb(var(--color-rose-800) / <alpha-value>)',
          900: 'rgb(var(--color-rose-900) / <alpha-value>)',
        },
        slate: {
          50: 'rgb(var(--color-slate-50) / <alpha-value>)',
          100: 'rgb(var(--color-slate-100) / <alpha-value>)',
          200: 'rgb(var(--color-slate-200) / <alpha-value>)',
          300: 'rgb(var(--color-slate-300) / <alpha-value>)',
          400: 'rgb(var(--color-slate-400) / <alpha-value>)',
          500: 'rgb(var(--color-slate-500) / <alpha-value>)',
          600: 'rgb(var(--color-slate-600) / <alpha-value>)',
          700: 'rgb(var(--color-slate-700) / <alpha-value>)',
          800: 'rgb(var(--color-slate-800) / <alpha-value>)',
          900: 'rgb(var(--color-slate-900) / <alpha-value>)',
        },
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.92) translateY(8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
        bubble: {
          '0%': { transform: 'translateY(0) translateX(0)', opacity: '0' },
          '5%': { opacity: '0.4' },
          '25%': { transform: 'translateY(-25vh) translateX(15px)' },
          '50%': { transform: 'translateY(-50vh) translateX(-10px)' },
          '75%': { transform: 'translateY(-75vh) translateX(10px)' },
          '95%': { opacity: '0.4' },
          '100%': { transform: 'translateY(-120vh) translateX(-15px)', opacity: '0' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.35s ease-out forwards',
        'slide-in-right': 'slideInRight 0.35s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.35s ease-out forwards',
        'pop-in': 'popIn 0.25s ease-out forwards',
        'pulse-soft': 'pulseSoft 1.4s infinite',
        'float': 'float 3s ease-in-out infinite',
        'bubble': 'bubble 15s linear infinite',
      },
    },
  },
  plugins: [],
};
