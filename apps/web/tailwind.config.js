/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                surface: { DEFAULT: '#ffffff', raised: '#f9fafb', overlay: '#f3f4f6', base: '#ffffff' },
                accent: { DEFAULT: '#111827', hover: '#374151', dim: '#1f2937' },
                success: '#059669',
                warning: '#d97706',
                danger: '#dc2626',
                neutral: { 50: '#fafafa', 100: '#f4f4f5', 200: '#e4e4e7', 300: '#d4d4d8', 400: '#a1a1aa', 500: '#71717a', 600: '#52525b', 700: '#3f3f46', 800: '#27272a', 900: '#18181b' },
            },
            fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] },
            animation: {
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                'slide-up': 'slide-up 0.3s ease-out',
                'fade-in': 'fade-in 0.2s ease-out',
            },
            keyframes: {
                'pulse-glow': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
                'slide-up': { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
                'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
            },
        },
    },
    plugins: [],
};
