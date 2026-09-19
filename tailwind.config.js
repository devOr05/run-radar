/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        radar: {
          dark: '#0B0F19',
          card: '#131B2E',
          cardHover: '#1B2642',
          border: '#1F2E4D',
          accent: '#00F0FF',
          accentGlow: 'rgba(0, 240, 255, 0.2)',
          success: '#10B981',
          warning: '#F59E0B',
          alert: '#EF4444',
          muted: '#94A3B8'
        }
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
}
