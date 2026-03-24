import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        pine: "var(--color-pine)",
        "pine-dark": "var(--color-pine-dark)",
        moss: "var(--color-moss)",
        "forest-light": "var(--color-forest-light)",
        amber: "var(--color-amber)",
        cream: "var(--color-cream)",
        ink: "var(--color-ink)",
        surface: "var(--color-surface)",
        border: "var(--color-border)",
        muted: "var(--color-muted)"
      },
      fontFamily: {
        sans: ["var(--font-sora)", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 16px 40px -20px rgba(8, 66, 53, 0.45)",
        card: "0 2px 12px rgba(0, 0, 0, 0.06)",
        "card-hover": "0 8px 24px rgba(27, 107, 58, 0.14)"
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem"
      }
    }
  },
  plugins: []
};

export default config;