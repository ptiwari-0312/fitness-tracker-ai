/**
 * Macro breakdown donut chart + calorie bar for the Meals screen.
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { VictoryPie } from "victory-native";
import { Colors } from "@/theme/colors";

interface MacroData {
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  total_calories: number;
}

interface CalorieChartProps {
  data: MacroData;
  goal?: number;
}

export function CalorieChart({ data, goal = 2000 }: CalorieChartProps) {
  const pieData = [
    { x: "Protein", y: Math.max(data.protein_g, 0.01) },
    { x: "Carbs", y: Math.max(data.carbs_g, 0.01) },
    { x: "Fat", y: Math.max(data.fat_g, 0.01) },
  ];

  const macroColors = [Colors.accent.blue, Colors.accent.orange, Colors.accent.purple];

  return (
    <View style={styles.container}>
      <VictoryPie
        data={pieData}
        width={180}
        height={180}
        innerRadius={55}
        colorScale={macroColors}
        labels={() => null}
        padding={10}
        style={{ parent: { overflow: "visible" } }}
      />

      {/* Center label */}
      <View style={styles.center}>
        <Text style={styles.calories}>{Math.round(data.total_calories)}</Text>
        <Text style={styles.unit}>kcal</Text>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {[
          { label: "Protein", value: data.protein_g, color: Colors.accent.blue },
          { label: "Carbs", value: data.carbs_g, color: Colors.accent.orange },
          { label: "Fat", value: data.fat_g, color: Colors.accent.purple },
        ].map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={styles.legendLabel}>{item.label}</Text>
            <Text style={styles.legendValue}>{Math.round(item.value)}g</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 16 },
  center: {
    position: "absolute",
    top: 60,
    alignItems: "center",
  },
  calories: { color: Colors.text.primary, fontSize: 22, fontWeight: "700" },
  unit: { color: Colors.text.muted, fontSize: 12 },
  legend: { flexDirection: "row", gap: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { color: Colors.text.secondary, fontSize: 12 },
  legendValue: { color: Colors.text.primary, fontSize: 12, fontWeight: "600" },
});
