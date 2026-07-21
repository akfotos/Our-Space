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
        welcomeIn: {
          '0%': { opacity: '0', transform: 'translateY(24px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        logoReveal: {
          '0%': { opacity: '0', transform: 'scale(0.6) rotate(-8deg)' },
          '70%': { transform: 'scale(1.08) rotate(2deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0)' },
        },
        heartBeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '20%': { transform: 'scale(1.22)' },
          '35%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.14)' },
        },
        welcomeProgress: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
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
        'welcome-in': 'welcomeIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'logo-reveal': 'logoReveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
        'heart-beat': 'heartBeat 1.1s ease-in-out 0.7s infinite',
        'welcome-progress': 'welcomeProgress 1.8s ease-out both',
        'bubble': 'bubble 15s linear infinite',
      },
    },
  },
  plugins: [],
};
