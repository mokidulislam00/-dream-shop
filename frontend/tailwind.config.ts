import type { Config } from "tailwindcss";

// Colors are CSS variables (RGB triplets) so opacity utilities work.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: token("paper"),
        surface: token("surface"),
        ink: token("ink"),
        muted: token("muted"),
        line: token("line"),
        accent: token("accent"),
        "accent-deep": token("accent-deep"),
        "accent-soft": token("accent-soft"),
        moss: token("moss"),
        "moss-soft": token("moss-soft"),
        amber: token("amber"),
        "amber-soft": token("amber-soft"),
        danger: token("danger"),
        "danger-soft": token("danger-soft"),
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "Times New Roman", "serif"],
        sans: [
          '"Instrument Sans"',
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      borderRadius: {
        DEFAULT: "6px",
        lg: "10px",
      },
      boxShadow: {
        card: "0 1px 2px rgb(var(--ink) / 0.05), 0 4px 16px rgb(var(--ink) / 0.04)",
        pop: "0 8px 30px rgb(var(--ink) / 0.14)",
      },
      maxWidth: {
        page: "80rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
