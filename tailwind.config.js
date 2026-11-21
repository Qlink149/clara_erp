/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Overused Grotesk', 'Inter', 'Segoe UI', 'Helvetica Neue', 'Arial', 'system-ui', 'sans-serif'],
        space: ['Overused Grotesk', 'Inter', 'Segoe UI', 'Helvetica Neue', 'Arial', 'system-ui', 'sans-serif'],
        display: ['Merriweather', 'Georgia', 'serif'],
        accent: ['Merriweather', 'Georgia', 'serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        // Brand palette remap — legacy cyan/blue/sky classes render executive purples
        cyan: { 50: '#f4f0ff', 100: '#e9e5ff', 200: '#d4c9f7', 300: '#8d57de', 400: '#5d27ca', 500: '#5d27ca', 600: '#1f0798', 700: '#1f0798', 800: '#070362', 900: '#070362', 950: '#0c0828' },
        sky: { 50: '#f4f0ff', 100: '#e9e5ff', 200: '#d4c9f7', 300: '#8d57de', 400: '#5d27ca', 500: '#5d27ca', 600: '#1f0798', 700: '#1f0798', 800: '#070362', 900: '#070362', 950: '#0c0828' },
        blue: { 50: '#f4f0ff', 100: '#e9e5ff', 200: '#d4c9f7', 300: '#8d57de', 400: '#5d27ca', 500: '#5d27ca', 600: '#1f0798', 700: '#1f0798', 800: '#070362', 900: '#070362', 950: '#0c0828' },
        indigo: { 50: '#f4f0ff', 100: '#e9e5ff', 200: '#d4c9f7', 300: '#8d57de', 400: '#5d27ca', 500: '#1f0798', 600: '#1f0798', 700: '#070362', 800: '#070362', 900: '#070362', 950: '#0c0828' },
        purple: { 50: '#f4f0ff', 100: '#e9e5ff', 200: '#d4c9f7', 300: '#8d57de', 400: '#8d57de', 500: '#5d27ca', 600: '#1f0798', 700: '#1f0798', 800: '#070362', 900: '#070362', 950: '#0c0828' },
        violet: { 50: '#f4f0ff', 100: '#e9e5ff', 200: '#d4c9f7', 300: '#8d57de', 400: '#8d57de', 500: '#5d27ca', 600: '#1f0798', 700: '#1f0798', 800: '#070362', 900: '#070362', 950: '#0c0828' },
        emerald: { 50: '#e9f9f2', 100: '#d9f4ea', 200: '#b3e9d5', 300: '#4cc99a', 400: '#22b07d', 500: '#22b07d', 600: '#0f7a55', 700: '#0f7a55', 800: '#0a5c40', 900: '#0a5c40', 950: '#063827' },
        green: { 50: '#e9f9f2', 100: '#d9f4ea', 200: '#b3e9d5', 300: '#4cc99a', 400: '#22b07d', 500: '#22b07d', 600: '#0f7a55', 700: '#0f7a55', 800: '#0a5c40', 900: '#0a5c40', 950: '#063827' },
        red: { 50: '#fcf0f4', 100: '#f9e1ea', 200: '#f2c3d4', 300: '#e18aa8', 400: '#d25f86', 500: '#d25f86', 600: '#a83060', 700: '#a83060', 800: '#7d2247', 900: '#7d2247', 950: '#4c142b' },
        rose: { 50: '#fcf0f4', 100: '#f9e1ea', 200: '#f2c3d4', 300: '#e18aa8', 400: '#d25f86', 500: '#d25f86', 600: '#a83060', 700: '#a83060', 800: '#7d2247', 900: '#7d2247', 950: '#4c142b' },
        amber: { 50: '#fef8ec', 100: '#fdf0d9', 200: '#fbe0b3', 300: '#fbbf24', 400: '#f59e0b', 500: '#f59e0b', 600: '#b45309', 700: '#b45309', 800: '#92400e', 900: '#92400e', 950: '#5b2807' },
        orange: { 50: '#fef8ec', 100: '#fdf0d9', 200: '#fbe0b3', 300: '#fbbf24', 400: '#f59e0b', 500: '#f59e0b', 600: '#b45309', 700: '#b45309', 800: '#92400e', 900: '#92400e', 950: '#5b2807' },
        yellow: { 50: '#fef8ec', 100: '#fdf0d9', 200: '#fbe0b3', 300: '#fbbf24', 400: '#f59e0b', 500: '#f59e0b', 600: '#b45309', 700: '#b45309', 800: '#92400e', 900: '#92400e', 950: '#5b2807' },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.25s ease-out',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
  safelist: [
    'bg-violet-500/15', 'text-violet-400', 'border-violet-500/20',
    'bg-cyan-500/15', 'text-cyan-400', 'border-cyan-500/20',
    'bg-amber-500/15', 'text-amber-400', 'border-amber-500/20',
    'bg-red-500/15', 'text-red-400', 'border-red-500/20',
    'bg-green-500/15', 'text-green-400', 'border-green-500/20',
    'bg-blue-500/15', 'text-blue-400', 'border-blue-500/20',
    'bg-purple-500/15', 'text-purple-400', 'border-purple-500/20',
    'bg-orange-500/15', 'text-orange-400', 'border-orange-500/20',
  ],
}
