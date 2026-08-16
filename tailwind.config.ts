import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        leaf: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        soil: {
          500: "#8b5e3c",
          600: "#6f452a",
          700: "#57361f",
        },
        wilting: "#a8a29e",
      },
      keyframes: {
        sway: {
          "0%,100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
        drop: {
          "0%": { transform: "translateY(-8px); opacity:0" },
          "100%": { transform: "translateY(0); opacity:1" },
        },
      },
      animation: {
        sway: "sway 3s ease-in-out infinite",
        drop: "drop .3s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;