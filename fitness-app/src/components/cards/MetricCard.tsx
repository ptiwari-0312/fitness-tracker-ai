/**
 * Compact stat card used on the dashboard.
 * Supports gradient icon backgrounds and optional sub-metric row.
 */
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { GlassCard } from "@/components/ui/GlassCard";
import { Colors } from "@/theme/colors";

interface MetricCardProps {
  title: string;
  value: string;
  unit?: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: readonly [string, string];
  subtitle?: string;
  progress?: number;   // 0-1, shows progress bar if provided
  style?: ViewStyle;
}

export function MetricCard({
  title,
  value,
  unit,
  icon,
  gradient,
  subtitle,
  progress,
  style,
}: MetricCardProps) {
  return (
    <GlassCard style={style} padding={16}>
      <View style={styles.row}>
        <LinearGradient colors={gradient} style={styles.iconBg}>
          <Ionicons name={icon} size={20} color="#fff" />
        </LinearGradient>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>

      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

      {progress !== undefined && (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: gradient[0] },
            ]}
          />
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: Colors.text.secondary, fontSize: 13, fontWeight: "500" },
  valueRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  value: { color: Colors.text.primary, fontSize: 28, fontWeight: "700" },
  unit: { color: Colors.text.secondary, fontSize: 14, fontWeight: "500", marginBottom: 2 },
  subtitle: { color: Colors.text.muted, fontSize: 12, marginTop: 4 },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.background.tertiary,
    borderRadius: 2,
    marginTop: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
});
