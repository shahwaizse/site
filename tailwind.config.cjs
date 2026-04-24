/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#262624", // Claude-ish warm dark grey
          elevated: "#30302e",
          subtle: "#1f1e1d",
        },
        fg: {
          DEFAULT: "#faf9f5", // Claude warm off-white
          muted: "#c8c5bd",
          subtle: "#8a867e",
        },
        accent: {
          DEFAULT: "#d97757",
          muted: "#a85a3e",
        },
        border: {
          DEFAULT: "#3a3937",
          subtle: "#2f2e2c",
        },
      },
      fontFamily: {
        serif: ['"Fraunces"', "ui-serif", "Georgia", "serif"],
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      animation: {
        "fade-up": "fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fadeIn 0.3s ease-out forwards",
        shimmer: "shimmer 1.6s linear infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: 0, transform: "translateY(8px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
