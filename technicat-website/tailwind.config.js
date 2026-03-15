/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ["'Inter'", "system-ui", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "'Inter'", "sans-serif"],
      },
      colors: {
        blue: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
      },
      animation: {
        "fade-up":   "fadeUp 0.65s cubic-bezier(0.16,1,0.3,1) forwards",
        "fade-in":   "fadeIn 0.45s ease forwards",
        "slide-down":"slideDown 0.3s ease forwards",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(28px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideDown: {
          "0%":   { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        "card":    "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)",
        "card-lg": "0 4px 6px rgba(0,0,0,0.03), 0 12px 40px rgba(0,0,0,0.08)",
        "glow":    "0 0 0 1px rgba(37,99,235,0.15), 0 8px 40px rgba(37,99,235,0.12)",
        "glow-sm": "0 0 0 1px rgba(37,99,235,0.1),  0 4px 20px rgba(37,99,235,0.08)",
        "inner-glow": "inset 0 1px 0 rgba(255,255,255,0.06)",
      },
      backgroundImage: {
        "grid-slate":   "linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)",
        "grid-dark":    "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        "hero-radial":  "radial-gradient(ellipse 80% 60% at 65% -10%, rgba(37,99,235,0.08) 0%, transparent 65%)",
        "blue-radial":  "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(37,99,235,0.1) 0%, transparent 70%)",
        "shine":        "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)",
      },
      backgroundSize: {
        "grid": "56px 56px",
      },
    },
  },
  plugins: [],
};