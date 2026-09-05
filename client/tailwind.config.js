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
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      },
      keyframes: {
        highlight: {
          '0%': { backgroundColor: 'rgba(59, 130, 246, 0.25)' },
          '100%': { backgroundColor: 'transparent' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)' },
          '50%': { boxShadow: '0 0 25px rgba(59, 130, 246, 0.8)' }
        }
      },
      animation: {
        'highlight-fade': 'highlight 2.5s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out'
      }
    },
  },
  plugins: [],
}
