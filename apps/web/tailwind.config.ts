import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                surface: "hsl(var(--surface))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                    hover: "hsl(var(--primary-hover))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                    hover: "hsl(var(--accent-hover))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                success: {
                    DEFAULT: "hsl(var(--success))",
                    foreground: "hsl(var(--success-foreground))",
                },
                warning: {
                    DEFAULT: "hsl(var(--warning))",
                    foreground: "hsl(var(--warning-foreground))",
                },
                error: {
                    DEFAULT: "hsl(var(--error))",
                    foreground: "hsl(var(--error-foreground))",
                },
                info: {
                    DEFAULT: "hsl(var(--info))",
                    foreground: "hsl(var(--info-foreground))",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                "fade-in-up": {
                    "0%": { opacity: "0", transform: "translateY(20px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                "fade-in": {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                "slide-in-from-right": {
                    "0%": { transform: "translateX(100%)" },
                    "100%": { transform: "translateX(0)" },
                },
                "logo-glow": {
                    "0%, 100%": { filter: "drop-shadow(0 0 8px rgba(37, 99, 235, 0.4))" },
                    "50%": { filter: "drop-shadow(0 0 16px rgba(37, 99, 235, 0.6))" },
                },
                "scale-in": {
                    "0%": { opacity: "0", transform: "scale(0.95)" },
                    "100%": { opacity: "1", transform: "scale(1)" },
                },
                "pulse-subtle": {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0.8" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "fade-in-up": "fade-in-up 0.6s ease-out",
                "fade-in": "fade-in 0.4s ease-out",
                "slide-in-from-right": "slide-in-from-right 0.3s ease-out",
                "logo-glow": "logo-glow 3s ease-in-out infinite",
                "scale-in": "scale-in 0.4s ease-out",
                "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
            },
            fontFamily: {
                sans: ["var(--font-inter)", "ui-sans-serif", "system-ui"],
                display: ["var(--font-outfit)", "ui-sans-serif", "system-ui"],
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
}
export default config;
