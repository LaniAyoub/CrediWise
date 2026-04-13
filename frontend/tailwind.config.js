/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eef6ff',
          100: '#d9eaff',
          200: '#bcdbff',
          300: '#8ec5ff',
          400: '#59a4ff',
          500: '#3381fc',
          600: '#1d62f1',
          700: '#154dde',
          800: '#183fb4',
          900: '#1a398e',
          950: '#142456',
        },
        navy: {
          50:  '#f0f4fd',
          100: '#e0e8f9',
          200: '#c8d5f4',
          300: '#a3b8ec',
          400: '#7892e1',
          500: '#5970d7',
          600: '#4454ca',
          700: '#3a44b9',
          800: '#353c97',
          900: '#2e3578',
          950: '#0f172a',
        },
        surface: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        accent: {
          emerald: '#10b981',
          amber:   '#f59e0b',
          rose:    '#f43f5e',
          violet:  '#8b5cf6',
        }
      },
      boxShadow: {
        'glow':       '0 0 20px rgba(51, 129, 252, 0.15)',
        'glow-lg':    '0 0 40px rgba(51, 129, 252, 0.2)',
        'card':       '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 10px 25px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.05)',
        'sidebar':    '4px 0 24px rgba(0,0,0,0.12)',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'slide-in':   'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer':    'shimmer 2s infinite linear',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
