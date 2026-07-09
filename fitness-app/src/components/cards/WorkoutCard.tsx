import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Colors } from "@/theme/colors";
import type { WorkoutLog } from "@/services/workoutService";
import { format, parseISO } from "date-fns";

interface WorkoutCardProps {
  workout: WorkoutLog;
  onPress?: () => void;
}

export function WorkoutCard({ workout, onPress }: WorkoutCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <GlassCard style={styles.card} padding={0}>
        <View style={styles.inner}>
          <LinearGradient colors={Colors.gradient.primary} style={styles.accent} />

          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.name} numberOfLines={1}>{workout.name}</Text>
              <Badge
                label={workout.is_completed ? "Done" : "In Progress"}
                variant={workout.is_completed ? "success" : "warning"}
              />
            </View>

            <View style={styles.stats}>
              {workout.duration_minutes && (
                <View style={styles.stat}>
                  <Ionicons name="time-outline" size={14} color={Colors.text.muted} />
                  <Text style={styles.statText}>{workout.duration_minutes} min</Text>
                </View>
              )}
              {workout.calories_burned && (
                <View style={styles.stat}>
                  <Ionicons name="flame-outline" size={14} color={Colors.accent.orange} />
                  <Text style={styles.statText}>{Math.round(workout.calories_burned)} kcal</Text>
                </View>
              )}
              <View style={styles.stat}>
                <Ionicons name="barbell-outline" size={14} color={Colors.text.muted} />
                <Text style={styles.statText}>{workout.sets.length} sets</Text>
              </View>
            </View>

            <Text style={styles.date}>
              {format(parseISO(workout.created_at), "MMM d, yyyy")}
            </Text>
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  inner: { flexDirection: "row", overflow: "hidden" },
  accent: { width: 4, borderRadius: 2 },
  content: { flex: 1, padding: 16, gap: 8 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { color: Colors.text.primary, fontSize: 16, fontWeight: "600", flex: 1, marginRight: 8 },
  stats: { flexDirection: "row", gap: 16 },
  stat: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { color: Colors.text.secondary, fontSize: 13 },
  date: { color: Colors.text.muted, fontSize: 12 },
});
