import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

// Mathetes brand tokens. Hex values are canonical; never deviate.
// "YouVersion" theme: clean near-white UI with a single red accent. The accent
// keeps the name `copper` so existing bg-copper / text-copper / var(--copper)
// usages cascade to the new red without renaming.
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1A1A1A",
        parchment: "#F7F7F8",
        copper: "#F33A49",
        oxblood: "#9B2C36",
        surface: {
          1: "#FFFFFF",
          2: "#EFEFF1",
          "1-dark": "#1C1C1F",
          "2-dark": "#27272A",
        },
        border: "#E4E4E7",
        "border-dark": "#3A3A3E",
        // Seven house accent colors (avatar identity rings). Unchanged.
        house: {
          bethel: "#B87333",
          antioch: "#722F37",
          berea: "#A87C3E",
          bethany: "#7A8A6E",
          zion: "#C9A24A",
          hebron: "#A85838",
          salem: "#6B7F8A",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Fraunces", "serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        scripture: ["var(--font-source-serif)", "Source Serif 4", "serif"],
      },
      spacing: {
        // 4px base scale: 4 8 12 16 24 32 48 64
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "6": "24px",
        "8": "32px",
        "12": "48px",
        "16": "64px",
      },
      borderColor: {
        DEFAULT: "#E4E4E7",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
