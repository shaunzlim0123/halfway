import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        deep: "#0a0f1a",
        surface: "#131b2e",
        card: "#1a2340",
        "card-hover": "#1f2a4a",
        saffron: { DEFAULT: "#e8a838", dim: "#c48a2a", light: "#f0c75e" },
        mint: "#5de5d5",
        coral: "#f06449",
        "text-primary": "#eae4dc",
        "text-secondary": "#7e8ca3",
        "text-muted": "#4a5672",
        border: "#2a3655",
      },
      fontFamily: {
        display: ["Young Serif", "Georgia", "serif"],
        body: ["Figtree", "system-ui", "sans-serif"],
        mono: ["Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
