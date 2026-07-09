import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { Colors } from "@/theme/colors";

type BadgeVariant = "primary" | "success" | "warning" | "danger" | "info" | "ghost";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  primary: { bg: `${Colors.primary}22`, text: Colors.primary },
  success: { bg: `${Colors.success}22`, text: Colors.success },
  warning: { bg: `${Colors.warning}22`, text: Colors.warning },
  danger: { bg: `${Colors.error}22`, text: Colors.error },
  info: { bg: `${Colors.info}22`, text: Colors.info },
  ghost: { bg: Colors.background.cardBorder, text: Colors.text.secondary },
};

export function Badge({ label, variant = "primary", style }: BadgeProps) {
  const colors = variantColors[variant];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  label: { fontSize: 11, fontWeight: "600", letterSpacing: 0.3 },
});
