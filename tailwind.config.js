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
        background: '#08090C',
        surface: {
          DEFAULT: '#0E1015',
          subtle: '#14161E',
          card: '#0D0F15',
          border: 'rgba(255, 255, 255, 0.08)',
          hover: '#191C26',
        },
        slate: {
          950: '#08090C',
          900: '#0E1015',
          850: '#14161E',
          800: '#1E222E',
          700: '#2E3445',
          600: '#4B556A',
          500: '#6E7891',
          400: '#949EB5',
          300: '#C2C9D9',
          200: '#E2E6F0',
          100: '#F1F4FA',
        },
        meteo: {
          obs: '#38BDF8',
          ecmwf: '#3B82F6',
          gfs: '#10B981',
          icon: '#F59E0B',
          ai: '#8B5CF6',
          blend: '#F43F5E',
          neutral: '#71717A',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        'display': ['5.5rem', { lineHeight: '1.02', letterSpacing: '-0.04em' }],
        'display-mobile': ['3.25rem', { lineHeight: '1.08', letterSpacing: '-0.03em' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      }
    },
  },
  plugins: [],
}
