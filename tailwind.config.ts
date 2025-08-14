import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        tertiary: "var(--color-tertiary)",
        quaternary: "var(--color-quaternary)",
        muted: "var(--color-muted)",
        light: "var(--color-light)",
        lighter: "var(--color-lighter)",
        lightest: "var(--color-lightest)",
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        "surface-secondary": "var(--color-surface-secondary)",
        "surface-tertiary": "var(--color-surface-tertiary)",
        card: "var(--color-card)",
        "card-hover": "var(--color-card-hover)",
        hover: "var(--color-hover)",
        active: "var(--color-active)",
        focus: "var(--color-focus)",
        border: "var(--color-border)",
        "border-light": "var(--color-border-light)",
        "border-dark": "var(--color-border-dark)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        card: "var(--shadow-card)",
      },
      fontWeight: {
        normal: "var(--font-weight-normal)",
        medium: "var(--font-weight-medium)",
        semibold: "var(--font-weight-semibold)",
        bold: "var(--font-weight-bold)",
      },
      fontFamily: {
        game: ["var(--font-game)", "sans-serif"],
        "game-bold": ["var(--font-game-bold)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
