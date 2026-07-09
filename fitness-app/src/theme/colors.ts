/**
 * Centralized color palette.
 * All components reference this — change here to retheme the whole app.
 */
export const Colors = {
  // ── Backgrounds ───────────────────────────────────────────────────────────
  background: {
    primary: "#0A0A0F",
    secondary: "#12121A",
    tertiary: "#1A1A27",
    card: "rgba(255, 255, 255, 0.05)",
    cardBorder: "rgba(255, 255, 255, 0.10)",
  },

  // ── Brand ─────────────────────────────────────────────────────────────────
  primary: "#6C63FF",
  primaryLight: "#8B85FF",
  primaryDark: "#4E47CC",
  secondary: "#FF6584",
  secondaryLight: "#FF8FA3",

  // ── Accent palette ────────────────────────────────────────────────────────
  accent: {
    green: "#00D68F",
    orange: "#FF9F43",
    blue: "#54A0FF",
    purple: "#A55EEA",
    pink: "#FF6584",
  },

  // ── Gradients ─────────────────────────────────────────────────────────────
  gradient: {
    primary: ["#6C63FF", "#4E47CC"] as const,
    success: ["#00D68F", "#00A86B"] as const,
    warning: ["#FF9F43", "#E08B35"] as const,
    danger: ["#FF6584", "#E0506F"] as const,
    purple: ["#A55EEA", "#7B4FBB"] as const,
    blue: ["#54A0FF", "#3D7FCC"] as const,
  },

  // ── Text ─────────────────────────────────────────────────────────────────
  text: {
    primary: "#FFFFFF",
    secondary: "#A0A0B2",
    muted: "#5A5A6E",
    inverse: "#0A0A0F",
  },

  // ── System ───────────────────────────────────────────────────────────────
  success: "#00D68F",
  warning: "#FF9F43",
  error: "#FF4757",
  info: "#54A0FF",

  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
} as const;

export type ColorKey = keyof typeof Colors;
