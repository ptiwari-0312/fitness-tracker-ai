import { TextStyle } from "react-native";

export const Typography: Record<string, TextStyle> = {
  h1: { fontSize: 32, fontWeight: "700", letterSpacing: -0.5 },
  h2: { fontSize: 26, fontWeight: "700", letterSpacing: -0.3 },
  h3: { fontSize: 22, fontWeight: "600" },
  h4: { fontSize: 18, fontWeight: "600" },
  h5: { fontSize: 16, fontWeight: "600" },
  body: { fontSize: 15, fontWeight: "400", lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: "400", lineHeight: 19 },
  caption: { fontSize: 11, fontWeight: "400", letterSpacing: 0.2 },
  label: { fontSize: 12, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" },
  button: { fontSize: 15, fontWeight: "600", letterSpacing: 0.3 },
  buttonSmall: { fontSize: 13, fontWeight: "600", letterSpacing: 0.2 },
  metric: { fontSize: 36, fontWeight: "700", letterSpacing: -1 },
  metricSmall: { fontSize: 24, fontWeight: "700" },
};
