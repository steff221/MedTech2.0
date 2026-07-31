import type { Config } from "tailwindcss";

/**
 * Design system: "the clinical record".
 *
 * Palette comes from the operating theatre — surgical drape teal against
 * carmine. Drapes are that specific desaturated blue-green because it is the
 * optical complement of blood red, which suppresses afterimages for the
 * surgeon. That is the colour logic of the room this software is used in.
 *
 * Three of the scales below deliberately keep their Tailwind names while
 * carrying new hues, because ~690 usages across 60 files reference them
 * directly. Remapping here restyles the whole app from one place:
 *
 *   brand   → carmine  (institutional accent, seals, primary actions)
 *   teal    → drape    (structural chrome: nav, sidebars, headers)
 *   emerald → clinical green — KEPT GREEN ON PURPOSE. These usages mean
 *             "completed / active / success", not "brand". Recolouring them
 *             carmine would render every finished appointment blood-red.
 *   slate   → neutrals carrying a faint teal ink cast, so the greys read
 *             clinical rather than generic.
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Institutional accent — oxblood, deliberately not terracotta.
        brand: {
          50:  "#fbf2f3",
          100: "#f6e1e4",
          200: "#ebc3c9",
          300: "#da98a2",
          400: "#c26b79",
          500: "#a8404f",
          600: "#8e2436",
          700: "#741c2c",
          800: "#5b1622",
          900: "#421018",
        },
        // Structural chrome — surgical drape.
        teal: {
          50:  "#eff5f5",
          100: "#dae8e8",
          200: "#b5d1d2",
          300: "#86b3b5",
          400: "#558e91",
          500: "#337477",
          600: "#1e5f63",
          700: "#184d50",
          800: "#133c3f",
          900: "#0e2c2e",
        },
        // Success / active. Still green — just clinical instead of neon.
        emerald: {
          50:  "#eff5f1",
          100: "#dae9df",
          200: "#b6d3c1",
          300: "#8bb89d",
          400: "#5e9a76",
          500: "#3e7f58",
          600: "#2f6b4f",
          700: "#265741",
          800: "#1d4432",
          900: "#153224",
        },
        // Neutrals with a teal ink cast.
        slate: {
          50:  "#f4f6f6",
          100: "#e8ecec",
          200: "#d3dada",
          300: "#b2bdbe",
          400: "#8a9899",
          500: "#6b7a7c",
          600: "#556263",
          700: "#414d4e",
          800: "#2b3536",
          900: "#10262b",
        },
        // The landing page reaches for `gray` rather than `slate`; point both at
        // the same ink-cast neutrals so the two never drift apart on screen.
        gray: {
          50:  "#f4f6f6",
          100: "#e8ecec",
          200: "#d3dada",
          300: "#b2bdbe",
          400: "#8a9899",
          500: "#6b7a7c",
          600: "#556263",
          700: "#414d4e",
          800: "#2b3536",
          900: "#10262b",
        },
        // Marginalia and annotation.
        brass: {
          50:  "#fbf6ec",
          100: "#f5e9d2",
          200: "#ead3a6",
          300: "#dcb771",
          400: "#cda054",
          500: "#c08a3e",
          600: "#a2712f",
          700: "#815926",
          800: "#63441d",
          900: "#472f14",
        },
        ink:   "#10262b",
        paper: "#eceeec",
        chalk: "#ffffff",
      },
      fontFamily: {
        // Slab serif for headings — documentary, not the elegant didone default.
        display: ["var(--font-bitter)", "Georgia", "serif"],
        sans:    ["var(--font-plex-sans)", "system-ui", "sans-serif"],
        // Record numbers, MKB-10 codes, vitals, timestamps.
        mono:    ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        // Precision over softness: one tight shadow, no ambient bloom.
        card:         "0 1px 2px rgba(16,38,43,0.06)",
        "card-md":    "0 1px 2px rgba(16,38,43,0.07), 0 2px 6px rgba(16,38,43,0.05)",
        "card-lg":    "0 2px 4px rgba(16,38,43,0.08), 0 6px 16px rgba(16,38,43,0.06)",
        "card-hover": "0 3px 6px rgba(16,38,43,0.10), 0 10px 24px rgba(16,38,43,0.07)",
        // Former glows, now hairline rings — the bloom is gone but the
        // class names stay valid at their existing call sites.
        "glow-brand":    "0 0 0 1px rgba(142,36,54,0.35)",
        "glow-brand-sm": "0 0 0 1px rgba(142,36,54,0.25)",
        "glow-teal":     "0 0 0 1px rgba(30,95,99,0.30)",
        "inner-white":    "inset 0 1px 0 rgba(255,255,255,0.10)",
        "inner-white-lg": "inset 0 1px 0 rgba(255,255,255,0.14)",
        // Letterpress for the seal.
        seal: "inset 0 0 0 1px rgba(142,36,54,0.35)",
      },
      backgroundImage: {
        // Flat institutional blocks rather than showpiece gradients.
        "brand-gradient":   "linear-gradient(160deg, #184d50 0%, #10262b 100%)",
        "brand-gradient-r": "linear-gradient(to right, #1e5f63, #184d50)",
        "mesh-brand":
          "radial-gradient(at 12% 8%, rgba(30,95,99,0.10) 0px, transparent 55%), radial-gradient(at 88% 4%, rgba(142,36,54,0.07) 0px, transparent 50%)",
        "shimmer-gradient":
          "linear-gradient(90deg, rgba(211,218,218,0.35) 0%, rgba(244,246,246,0.85) 50%, rgba(211,218,218,0.35) 100%)",
      },
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // Was an expanding halo; now a restrained single pulse.
        "pulse-ring": {
          "0%":   { transform: "scale(1)",    opacity: "0.35" },
          "70%":  { transform: "scale(1.18)", opacity: "0" },
          "100%": { transform: "scale(1.18)", opacity: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-2px)" },
        },
        "spin-slow": {
          "0%":   { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        // The seal settling onto the page.
        "stamp-in": {
          "0%":  { opacity: "0", transform: "scale(1.5) rotate(-8deg)" },
          "60%": { opacity: "1", transform: "scale(0.97) rotate(-2.2deg)" },
          "100%":{ opacity: "1", transform: "scale(1) rotate(-2.2deg)" },
        },
      },
      animation: {
        shimmer:      "shimmer 1.6s ease-in-out infinite",
        "fade-up":    "fade-up 0.45s cubic-bezier(0.16,1,0.3,1) forwards",
        "fade-in":    "fade-in 0.35s ease-out forwards",
        "scale-in":   "scale-in 0.25s cubic-bezier(0.16,1,0.3,1) forwards",
        "slide-up":   "slide-up 0.5s cubic-bezier(0.16,1,0.3,1) forwards",
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(0.4,0,0.6,1) infinite",
        float:        "float 3.5s ease-in-out infinite",
        "spin-slow":  "spin-slow 3s linear infinite",
        "stamp-in":   "stamp-in 0.5s cubic-bezier(0.34,1.4,0.64,1) forwards",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      // Flattened across the board: the pillowy 1–2rem corners were doing more
      // to date the interface than any single colour.
      borderRadius: {
        none: "0",
        sm:   "2px",
        DEFAULT: "3px",
        md:   "4px",
        lg:   "4px",
        xl:   "5px",
        "2xl": "6px",
        "3xl": "8px",
        "4xl": "10px",
        full: "9999px",
      },
    },
  },
  plugins: [],
};

export default config;
