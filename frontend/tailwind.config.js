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
        pulseOnce: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
      },
    },
  },
  plugins: [],
};
