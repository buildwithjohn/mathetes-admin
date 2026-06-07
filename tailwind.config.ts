import type { Config } from "tailwindcss";

// Mathetes brand tokens. Hex values are canonical; never deviate.
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1C1B1A",
        parchment: "#F5F1EB",
        copper: "#B87333",
        oxblood: "#722F37",
        surface: {
          1: "#FFFFFF",
          2: "#EDE8E0",
          "1-dark": "#26241F",
          "2-dark": "#322F2A",
        },
        border: "#D9D2C5",
        "border-dark": "#3A3631",
        // Seven house accent colors (avatar identity rings).
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
        DEFAULT: "#D9D2C5",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
