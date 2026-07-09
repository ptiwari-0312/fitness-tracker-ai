/**
 * Glassmorphism card — the core visual primitive of the design system.
 * Uses BlurView on supported platforms, falls back to semi-transparent View.
 */
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { Colors } from "@/theme/colors";
import { BorderRadius } from "@/theme/spacing";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  padding?: number;
}

export function GlassCard({
  children,
  style,
  intensity = 20,
  padding = 16,
}: GlassCardProps) {
  return (
    <View style={[styles.container, style]}>
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[styles.border, StyleSheet.absoluteFill]} />
      <View style={{ padding }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    backgroundColor: Colors.background.card,
  },
  border: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.background.cardBorder,
  },
});
