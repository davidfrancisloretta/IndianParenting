import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211f",
        mint: "#d9f8dc",
        coral: "#ff7a5f",
        sun: "#ffd166",
        pool: "#77c8d5",
      },
      boxShadow: {
        soft: "0 12px 35px rgba(23, 33, 31, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
