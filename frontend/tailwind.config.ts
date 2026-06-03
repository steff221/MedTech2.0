import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        // Elevation scale
        card:      "0 1px 3px rgba(15,23,42,0.05), 0 4px 20px rgba(15,23,42,0.06)",
        "card-md": "0 4px 16px rgba(15,23,42,0.08), 0 1px 4px rgba(15,23,42,0.04)",
        "card-lg": "0 12px 32px rgba(15,23,42,0.10), 0 4px 8px rgba(15,23,42,0.04)",
        "card-hover": "0 16px 40px -8px rgba(15,23,42,0.14), 0 4px 12px rgba(15,23,42,0.06)",
        // Glows
        "glow-brand":    "0 0 24px rgba(16,185,129,0.30)",
        "glow-brand-sm": "0 0 12px rgba(16,185,129,0.22)",
        "glow-teal":     "0 0 24px rgba(20,184,166,0.25)",
        // Inner highlights
        "inner-white": "inset 0 1px 0 rgba(255,255,255,0.15)",
        "inner-white-lg": "inset 0 2px 0 rgba(255,255,255,0.20)",
      },
      backgroundImage: {
        "brand-gradient":   "linear-gradient(135deg, #059669 0%, #10b981 50%, #14b8a6 100%)",
        "brand-gradient-r": "linear-gradient(to right, #059669, #10b981)",
        "mesh-brand":
          "radial-gradient(at 40% 20%, rgba(16,185,129,0.18) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(20,184,166,0.12) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(5,150,105,0.10) 0px, transparent 50%)",
        "shimmer-gradient":
          "linear-gradient(90deg, rgba(226,232,240,0.4) 0%, rgba(241,245,249,0.9) 50%, rgba(226,232,240,0.4) 100%)",
      },
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.94)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%":   { transform: "scale(1)",   opacity: "0.5" },
          "60%":  { transform: "scale(1.45)", opacity: "0" },
          "100%": { transform: "scale(1.45)", opacity: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-4px)" },
        },
        "spin-slow": {
          "0%":   { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        shimmer:    "shimmer 1.6s ease-in-out infinite",
        "fade-up":  "fade-up 0.45s cubic-bezier(0.16,1,0.3,1) forwards",
        "fade-in":  "fade-in 0.35s ease-out forwards",
        "scale-in": "scale-in 0.25s cubic-bezier(0.16,1,0.3,1) forwards",
        "slide-up": "slide-up 0.5s cubic-bezier(0.16,1,0.3,1) forwards",
        "pulse-ring":"pulse-ring 2.2s cubic-bezier(0.4,0,0.6,1) infinite",
        float:      "float 3.5s ease-in-out infinite",
        "spin-slow": "spin-slow 3s linear infinite",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
