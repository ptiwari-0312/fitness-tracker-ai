import React from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Colors } from "@/theme/colors";
import { BorderRadius } from "@/theme/spacing";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

const sizeStyles = {
  sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 13 },
  md: { paddingVertical: 14, paddingHorizontal: 24, fontSize: 15 },
  lg: { paddingVertical: 18, paddingHorizontal: 32, fontSize: 16 },
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  fullWidth = false,
}: ButtonProps) {
  const sz = sizeStyles[size];

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  if (variant === "primary") {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        style={[fullWidth && { width: "100%" }, style]}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={Colors.gradient.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.base,
            { paddingVertical: sz.paddingVertical, paddingHorizontal: sz.paddingHorizontal },
            (disabled || loading) && styles.disabled,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={[styles.labelWhite, { fontSize: sz.fontSize }]}>{label}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const bgColor =
    variant === "ghost"
      ? "transparent"
      : variant === "danger"
      ? Colors.error
      : Colors.background.tertiary;

  const borderColor =
    variant === "ghost" ? Colors.background.cardBorder : "transparent";

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        {
          backgroundColor: bgColor,
          borderColor,
          borderWidth: variant === "ghost" ? 1 : 0,
          paddingVertical: sz.paddingVertical,
          paddingHorizontal: sz.paddingHorizontal,
        },
        (disabled || loading) && styles.disabled,
        fullWidth && { width: "100%" },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={Colors.text.primary} size="small" />
      ) : (
        <Text
          style={[
            variant === "danger" ? styles.labelWhite : styles.labelDefault,
            { fontSize: sz.fontSize },
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  disabled: { opacity: 0.5 },
  labelWhite: { color: "#fff", fontWeight: "600" },
  labelDefault: { color: Colors.text.primary, fontWeight: "600" },
});
