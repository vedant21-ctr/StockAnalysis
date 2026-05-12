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
                // Brand palette
                brand: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                },
                // Dark surfaces
                surface: {
                    0: '#060B18',
                    1: '#0A1020',
                    2: '#0F1629',
                    3: '#141D33',
                    4: '#1A2540',
                    border: 'rgba(255,255,255,0.08)',
                },
                // Keep primary for backward compat
                primary: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
                'grid-pattern': "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
            },
            backgroundSize: {
                'grid': '40px 40px',
            },
            animation: {
                'float': 'float 4s ease-in-out infinite',
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                'shimmer': 'shimmer 2s infinite',
                'spin-slow': 'spin-slow 20s linear infinite',
                'gradient': 'gradient-shift 4s ease infinite',
                'scan': 'scan 4s linear infinite',
                'blink': 'blink 1s step-end infinite',
                'count': 'count-up 0.5s ease-out forwards',
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
                'fade-in': 'fadeIn 0.4s ease-out',
                'scale-in': 'scaleIn 0.3s ease-out',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-8px)' },
                },
                'pulse-glow': {
                    '0%, 100%': { opacity: '0.4' },
                    '50%': { opacity: '1' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                'spin-slow': {
                    from: { transform: 'rotate(0deg)' },
                    to: { transform: 'rotate(360deg)' },
                },
                'gradient-shift': {
                    '0%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                    '100%': { backgroundPosition: '0% 50%' },
                },
                scan: {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(100vh)' },
                },
                blink: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0' },
                },
                'count-up': {
                    from: { opacity: '0', transform: 'translateY(10px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                slideUp: {
                    from: { opacity: '0', transform: 'translateY(20px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                slideDown: {
                    from: { opacity: '0', transform: 'translateY(-20px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                fadeIn: {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                scaleIn: {
                    from: { opacity: '0', transform: 'scale(0.95)' },
                    to: { opacity: '1', transform: 'scale(1)' },
                },
            },
            boxShadow: {
                'glow-blue': '0 0 40px rgba(59, 130, 246, 0.15), 0 0 80px rgba(59, 130, 246, 0.05)',
                'glow-green': '0 0 40px rgba(34, 197, 94, 0.15), 0 0 80px rgba(34, 197, 94, 0.05)',
                'glow-purple': '0 0 40px rgba(139, 92, 246, 0.15), 0 0 80px rgba(139, 92, 246, 0.05)',
                'glow-amber': '0 0 40px rgba(245, 158, 11, 0.15), 0 0 80px rgba(245, 158, 11, 0.05)',
                'card': '0 4px 24px rgba(0, 0, 0, 0.4), 0 1px 0 rgba(255, 255, 255, 0.05) inset',
                'card-hover': '0 8px 40px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(255, 255, 255, 0.08) inset',
            },
        },
    },
    plugins: [],
}
