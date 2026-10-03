/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Kantumruy Pro", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        khmer: ["Kantumruy Pro", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#fff6ef",
          100: "#ffead9",
          200: "#fed1b0",
          300: "#fcb07e",
          400: "#fa954f",
          500: "#f88034",
          600: "#c55107",
          700: "#a3440a",
          800: "#7f380b",
          900: "#672e09",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.04), 0 4px 16px rgba(16,24,40,.06)",
        lift: "0 12px 32px -8px rgba(16,24,40,.18)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "pulse-once": "pulseOnce 1s ease-out",
        "page-in": "pageIn 0.45s cubic-bezier(.2,.7,.2,1) both",
        pop: "pop 0.18s cubic-bezier(.2,.7,.2,1) both",
        "heart-pop": "heartPop 0.45s cubic-bezier(.3,1.6,.5,1)",
        "ken-burns": "kenBurns 9s ease-out both",
        "rise-in": "riseIn 0.7s cubic-bezier(.2,.7,.2,1) both",
        "slide-down": "slideDown 0.25s cubic-bezier(.2,.7,.2,1) both",
        "toast-in": "toastIn 0.3s cubic-bezier(.2,.7,.2,1) both",
        "zoom-in": "zoomIn 0.25s cubic-bezier(.2,.7,.2,1) both",
        shimmer: "shimmer 1.4s linear infinite",
        "float-slow": "floatSlow 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
        pageIn: {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "none" },
        },
        pop: {
          "0%": { opacity: 0, transform: "scale(.96) translateY(-4px)" },
          "100%": { opacity: 1, transform: "none" },
        },
        heartPop: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.35)" },
          "100%": { transform: "scale(1)" },
        },
        kenBurns: {
          "0%": { transform: "scale(1.12)" },
          "100%": { transform: "scale(1)" },
        },
        riseIn: {
          "0%": { opacity: 0, transform: "translateY(24px)" },
          "100%": { opacity: 1, transform: "none" },
        },
        slideDown: {
          "0%": { opacity: 0, transform: "translateY(-12px)" },
          "100%": { opacity: 1, transform: "none" },
        },
        toastIn: {
          "0%": { opacity: 0, transform: "translateY(12px) scale(.98)" },
          "100%": { opacity: 1, transform: "none" },
        },
        zoomIn: {
          "0%": { opacity: 0, transform: "scale(.96)" },
          "100%": { opacity: 1, transform: "none" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        pulseOnce: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
      },
    },
  },
  plugins: [],
};
