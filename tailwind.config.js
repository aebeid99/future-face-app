/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // FutureFace Brand
        gold: {
          DEFAULT: '#D4920E',
          50:  '#FFF8E8',
          100: '#FEEFC4',
          200: '#FDDF89',
          300: '#FCC64E',
          400: '#FBAD23',
          500: '#D4920E',
          600: '#A9720A',
          700: '#7E5308',
          800: '#533806',
          900: '#291C03',
        },
        // App Backgrounds (dark navy)
        dark: {
          DEFAULT: '#0A0D18',
          50:  '#1E2540',
          100: '#181D32',
          200: '#131829',
          300: '#0F1220',
          400: '#0A0D18',
          500: '#080A14',
          600: '#050710',
          700: '#03040C',
          800: '#020308',
          900: '#010204',
        },
        surface: {
          DEFAULT: '#131829',
          hover: '#1A2035',
          active: '#212742',
        },
        border: {
          DEFAULT: '#1E2540',
          light: '#2A3355',
          subtle: '#161B2E',
        },
        // Text
        ink: {
          DEFAULT: '#F0F2FF',
          muted: '#8892A4',
          faint: '#505974',
        },
        // Semantic
        success: { DEFAULT: '#10B981', light: '#D1FAE5', dark: '#065F46' },
        warning: { DEFAULT: '#F59E0B', light: '#FEF3C7', dark: '#92400E' },
        error:   { DEFAULT: '#EF4444', light: '#FEE2E2', dark: '#991B1B' },
        info:    { DEFAULT: '#3B82F6', light: '#DBEAFE', dark: '#1E3A8A' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        arabic: ['Noto Sans Arabic', 'Cairo', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        card:  '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        panel: '0 4px 24px rgba(0,0,0,0.5)',
        glow:  '0 0 24px rgba(212,146,14,0.25)',
        inner: 'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-in':   'slideIn 0.2s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'spin-slow':  'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn:   { from: { transform: 'translateX(-8px)', opacity: 0 }, to: { transform: 'translateX(0)', opacity: 1 } },
        slideUp:   { from: { transform: 'translateY(8px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        pulseGold: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.6 } },
      },
    },
  },
  plugins: [],
}
