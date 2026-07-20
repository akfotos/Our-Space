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
    },
  },
  plugins: [],
};
