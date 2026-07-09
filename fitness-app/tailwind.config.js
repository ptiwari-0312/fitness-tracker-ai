/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Dark background layers
        background: {
          DEFAULT: "#0A0A0F",
          secondary: "#12121A",
          tertiary: "#1A1A27",
        },
        // Brand accent
        primary: {
          DEFAULT: "#6C63FF",
          light: "#8B85FF",
          dark: "#4E47CC",
        },
        secondary: {
          DEFAULT: "#FF6584",
          light: "#FF8FA3",
        },
        accent: {
          green: "#00D68F",
          orange: "#FF9F43",
          blue: "#54A0FF",
          purple: "#A55EEA",
        },
        glass: {
          DEFAULT: "rgba(255,255,255,0.06)",
          border: "rgba(255,255,255,0.1)",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#A0A0B2",
          muted: "#5A5A6E",
        },
      },
      fontFamily: {
        sans: ["Inter-Regular"],
        medium: ["Inter-Medium"],
        semibold: ["Inter-SemiBold"],
        bold: ["Inter-Bold"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
      },
    },
  },
  plugins: [],
};
