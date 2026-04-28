import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // readable text on pastels
        ink: "#374151",
        // Pastel brand palette
        green: {
          50: "#f0fbf7",
          100: "#a7f3d0",
          200: "#7fe6b8",
          300: "#46d99f",
          500: "#16b57f",
          600: "#0f8f63",
        },
        blue: {
          50: "#f0f8ff",
          100: "#a5d8ff",
          200: "#6fc2ff",
          300: "#2faeff",
          500: "#0077e6",
          600: "#005bb4",
        },
        pink: {
          50: "#fff6fb",
          100: "#ffc9e5",
          200: "#ff9fd6",
          300: "#ff76c7",
          500: "#ff2aa0",
          600: "#cc207f",
        },
        yellow: {
          50: "#fffdf0",
          100: "#fff4a3",
          200: "#fff09a",
          300: "#ffe86d",
          500: "#ffd100",
          600: "#ccaa00",
        },
        purple: {
          50: "#fbf8fe",
          100: "#dcc5f5",
          200: "#c7aef0",
          300: "#b390ec",
          500: "#8a5fe0",
          600: "#6a47b8",
        },
        peach: {
          50: "#fff7f0",
          100: "#ffd4a3",
          200: "#ffc28a",
          300: "#ffb370",
          500: "#ff8f3b",
          600: "#cc732f",
        },
      },
      boxShadow: {
        soft: "0 12px 35px rgba(55, 65, 81, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
