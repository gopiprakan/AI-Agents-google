/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0F172A',
        cardBg: '#111827',
        cardBorder: '#1E293B',
        cyanGlow: '#06B6D4',
        emeraldSuccess: '#22C55E',
        roseEmergency: '#EF4444',
        amberWarning: '#F59E0B'
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        neonCyan: '0 0 15px rgba(6, 182, 212, 0.4)',
        neonRose: '0 0 20px rgba(239, 68, 68, 0.5)'
      }
    },
  },
  plugins: [],
}
