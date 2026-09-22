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
        background: '#0B0F17',
        surface: {
          DEFAULT: '#111726',
          subtle: '#161F33',
          card: '#0E1422',
          border: '#1E293B',
          hover: '#1B2438',
        },
        meteo: {
          obs: '#38BDF8', // Cyan observation
          ecmwf: '#3B82F6', // Royal blue
          gfs: '#10B981', // Emerald
          icon: '#F59E0B', // Amber
          ai: '#A855F7', // Violet GraphCast
          blend: '#F43F5E', // Rose adaptive blend
          spread: '#94A3B8', // Neutral slate spread
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'pulse-subtle': 'pulseSubtle 2.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        }
      }
    },
  },
  plugins: [],
}
