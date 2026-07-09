/**
 * Weight trend chart using Victory Native.
 * Shows the last 30 data points with a smooth area curve.
 */
import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import {
  VictoryChart,
  VictoryArea,
  VictoryAxis,
  VictoryLine,
  VictoryScatter,
} from "victory-native";
import { Colors } from "@/theme/colors";
import type { WeightLog } from "@/services/weightService";

const { width } = Dimensions.get("window");
const CHART_WIDTH = width - 48;  // screen - horizontal padding

interface WeightChartProps {
  logs: WeightLog[];
  target?: number;
}

export function WeightChart({ logs, target }: WeightChartProps) {
  if (logs.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Add at least 2 weight entries to see your trend</Text>
      </View>
    );
  }

  const sorted = [...logs].sort((a, b) => a.log_date.localeCompare(b.log_date));
  const data = sorted.map((l, i) => ({ x: i, y: l.weight_kg, date: l.log_date }));
  const weights = data.map((d) => d.y);
  const minY = Math.min(...weights) - 2;
  const maxY = Math.max(...weights) + 2;

  return (
    <VictoryChart
      width={CHART_WIDTH}
      height={220}
      padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
      domain={{ y: [minY, maxY] }}
    >
      <VictoryAxis
        tickFormat={(_, i) =>
          i % Math.ceil(data.length / 5) === 0
            ? sorted[i]?.log_date.slice(5) ?? ""
            : ""
        }
        style={{
          axis: { stroke: Colors.background.tertiary },
          tickLabels: { fill: Colors.text.muted, fontSize: 10 },
          grid: { stroke: "transparent" },
        }}
      />
      <VictoryAxis
        dependentAxis
        style={{
          axis: { stroke: "transparent" },
          tickLabels: { fill: Colors.text.muted, fontSize: 10 },
          grid: { stroke: Colors.background.tertiary, strokeDasharray: "4,4" },
        }}
      />

      {/* Gradient fill area */}
      <VictoryArea
        data={data}
        style={{
          data: {
            fill: `${Colors.primary}20`,
            stroke: Colors.primary,
            strokeWidth: 2,
          },
        }}
        interpolation="monotoneX"
      />

      {/* Data points */}
      <VictoryScatter
        data={data}
        size={4}
        style={{ data: { fill: Colors.primary, stroke: Colors.background.primary, strokeWidth: 2 } }}
      />

      {/* Target weight line */}
      {target && (
        <VictoryLine
          y={() => target}
          style={{
            data: {
              stroke: Colors.accent.green,
              strokeWidth: 1.5,
              strokeDasharray: "6,4",
            },
          }}
        />
      )}
    </VictoryChart>
  );
}

const styles = StyleSheet.create({
  empty: { height: 160, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyText: { color: Colors.text.muted, textAlign: "center", fontSize: 14 },
});
