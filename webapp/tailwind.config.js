/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Extended blue palette
        navy: {
          950: "hsl(215 60% 6%)",
          900: "hsl(216 58% 9%)",
          800: "hsl(217 55% 13%)",
          700: "hsl(218 52% 18%)",
          600: "hsl(219 50% 24%)",
        },
        royal: {
          600: "hsl(221 72% 38%)",
          500: "hsl(221 75% 48%)",
          400: "hsl(221 78% 58%)",
          300: "hsl(221 82% 70%)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 10px)",
      },
      fontFamily: {
        sans: ["Inter", "Plus Jakarta Sans", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        jakarta: ["Plus Jakarta Sans", "Inter", "sans-serif"],
      },
      boxShadow: {
        "sm-blue":  "0 2px 8px -2px hsla(221,72%,48%,0.12)",
        "md-blue":  "0 8px 24px -4px hsla(221,72%,48%,0.18)",
        "lg-blue":  "0 16px 48px -8px hsla(221,72%,48%,0.22)",
        "xl-blue":  "0 24px 64px -8px hsla(221,72%,48%,0.28)",
        "glow":     "0 0 24px hsla(221,75%,55%,0.20)",
        "glow-sm":  "0 0 12px hsla(221,75%,55%,0.16)",
        "inset-top": "inset 0 1px 0 hsla(0,0%,100%,0.6)",
      },
      backgroundImage: {
        "gradient-blue": "linear-gradient(135deg, hsl(217 58% 9%) 0%, hsl(221 72% 22%) 100%)",
        "gradient-royal": "linear-gradient(135deg, hsl(221 72% 38%) 0%, hsl(221 75% 52%) 100%)",
        "gradient-cyber": "linear-gradient(135deg, hsl(221 72% 38%) 0%, hsl(195 88% 45%) 100%)",
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
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsla(221,75%,55%,0.25)" },
          "50%": { boxShadow: "0 0 0 8px hsla(221,75%,55%,0)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.35s ease both",
        "fade-in-up": "fade-in-up 0.45s cubic-bezier(0.22,1,0.36,1) both",
        "scale-in": "scale-in 0.3s cubic-bezier(0.22,1,0.36,1) both",
        "slide-in-right": "slide-in-right 0.35s cubic-bezier(0.22,1,0.36,1) both",
        "glow-pulse": "glow-pulse 2.5s ease infinite",
        "float": "float 4s ease-in-out infinite",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
