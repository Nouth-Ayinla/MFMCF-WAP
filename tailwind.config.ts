import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "surface-container": "#e7eefe",
        "on-surface-variant": "#4c4452",
        "on-primary": "#ffffff",
        surface: "#f9f9ff",
        primary: "#500088",
        "outline-variant": "#cfc2d4",
        "surface-container-low": "#f0f3ff",
        outline: "#7e7383",
        background: "#f9f9ff",
        secondary: "#5e5e5e",
        "primary-container": "#6b21a8",
        "primary-fixed": "#f1dbff",
        "on-primary-container": "#d7a8ff",
        "surface-container-high": "#e2e8f8",
        "on-background": "#151c27",
        error: "#ba1a1a",
        "on-surface": "#151c27",
        "surface-container-lowest": "#ffffff",
        "on-error": "#ffffff",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
      spacing: {
        unit: "8px",
        "container-margin": "24px",
        "card-padding": "24px",
        "section-gap": "64px",
        gutter: "16px",
      },
      fontFamily: {
        "headline-lg-mobile": ["Hanken Grotesk"],
        "body-lg": ["Hanken Grotesk"],
        "headline-md": ["Hanken Grotesk"],
        "headline-lg": ["Hanken Grotesk"],
        "body-md": ["Hanken Grotesk"],
        "label-md": ["Hanken Grotesk"],
        "label-bold": ["Hanken Grotesk"],
        display: ["Hanken Grotesk"],
      },
      fontSize: {
        "headline-lg-mobile": ["24px", { lineHeight: "32px", fontWeight: "700" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "headline-lg": ["32px", { lineHeight: "40px", fontWeight: "700" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "label-md": ["14px", { lineHeight: "20px", fontWeight: "500" }],
        "label-bold": [
          "14px",
          { lineHeight: "20px", letterSpacing: "0.05em", fontWeight: "700" },
        ],
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/container-queries")],
};

export default config;
