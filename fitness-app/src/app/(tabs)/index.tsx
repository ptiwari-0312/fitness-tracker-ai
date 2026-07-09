/**
 * Dashboard — the app's home screen.
 * Shows today's metrics: calories, water, weight, streak, and quick-action buttons.
 */
import React from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { SafeAreaView } from "react-native-safe-area-context";
import { MetricCard } from "@/components/cards/MetricCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { useAuthStore } from "@/store/authStore";
import { useDailyNutrition, useDailyWater, useWeightProgress, useWeeklySummary } from "@/hooks/useFitness";
import { Colors } from "@/theme/colors";

const { width } = Dimensions.get("window");

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const today = format(new Date(), "yyyy-MM-dd");
  const todayLabel = format(new Date(), "EEEE, MMMM d");

  const { data: nutrition } = useDailyNutrition(today);
  const { data: water } = useDailyWater(today);
  const { data: weight } = useWeightProgress();
  const { data: summary } = useWeeklySummary();

  const calorieGoal = 2000;
  const calorieProgress = (nutrition?.total_calories ?? 0) / calorieGoal;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Good {getTimeGreeting()},{" "}
              <Text style={{ color: Colors.primary }}>{user?.name?.split(" ")[0] ?? "Champion"}</Text>
            </Text>
            <Text style={styles.date}>{todayLabel}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/ai-coach")}
            style={styles.aiBtn}
          >
            <LinearGradient colors={Colors.gradient.primary} style={styles.aiBtnInner}>
              <Ionicons name="sparkles" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Streak Banner */}
        {(user?.streak_days ?? 0) > 0 && (
          <LinearGradient
            colors={Colors.gradient.warning}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.streakBanner}
          >
            <Ionicons name="flame" size={22} color="#fff" />
            <Text style={styles.streakText}>
              {user?.streak_days} day streak! Keep it up!
            </Text>
          </LinearGradient>
        )}

        {/* Main calorie ring */}
        <GlassCard style={styles.calorieCard} padding={24}>
          <View style={styles.calorieContent}>
            <View>
              <Text style={styles.sectionLabel}>Today's Calories</Text>
              <Text style={styles.calorieValue}>
                {Math.round(nutrition?.total_calories ?? 0)}
              </Text>
              <Text style={styles.calorieUnit}>/ {calorieGoal} kcal goal</Text>
            </View>
            <ProgressRing
              size={110}
              progress={calorieProgress * 100}
              color={Colors.primary}
              label={`${Math.round(calorieProgress * 100)}%`}
              sublabel="of goal"
            />
          </View>

          {/* Macro mini-bars */}
          <View style={styles.macros}>
            {[
              { label: "Protein", value: nutrition?.total_protein_g ?? 0, goal: 150, color: Colors.accent.blue },
              { label: "Carbs", value: nutrition?.total_carbs_g ?? 0, goal: 250, color: Colors.accent.orange },
              { label: "Fat", value: nutrition?.total_fat_g ?? 0, goal: 65, color: Colors.accent.purple },
            ].map((m) => (
              <View key={m.label} style={styles.macroItem}>
                <Text style={styles.macroLabel}>{m.label}</Text>
                <View style={styles.macroBar}>
                  <View
                    style={[
                      styles.macroFill,
                      { width: `${Math.min((m.value / m.goal) * 100, 100)}%`, backgroundColor: m.color },
                    ]}
                  />
                </View>
                <Text style={styles.macroValue}>{Math.round(m.value)}g</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* Metric grid */}
        <View style={styles.grid}>
          <MetricCard
            title="Water"
            value={((water?.total_ml ?? 0) / 1000).toFixed(1)}
            unit="L"
            icon="water-outline"
            gradient={Colors.gradient.blue}
            subtitle={`Goal: ${(water?.goal_ml ?? 2500) / 1000}L`}
            progress={(water?.percentage ?? 0) / 100}
            style={styles.gridItem}
          />
          <MetricCard
            title="Weight"
            value={String(weight?.current_weight?.toFixed(1) ?? "—")}
            unit="kg"
            icon="scale-outline"
            gradient={Colors.gradient.purple}
            subtitle={weight?.total_change != null
              ? `${weight.total_change > 0 ? "+" : ""}${weight.total_change.toFixed(1)} kg total`
              : "No logs yet"
            }
            style={styles.gridItem}
          />
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actions}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionBtn}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.8}
            >
              <LinearGradient colors={action.gradient} style={styles.actionIcon}>
                <Ionicons name={action.icon as any} size={20} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* AI Weekly Summary */}
        {summary && (
          <GlassCard style={styles.summaryCard} padding={20}>
            <View style={styles.summaryHeader}>
              <Ionicons name="sparkles" size={18} color={Colors.primary} />
              <Text style={styles.summaryTitle}>AI Coach Summary</Text>
            </View>
            <Text style={styles.summaryMsg}>{summary.motivational_message}</Text>
            {summary.recommendations.slice(0, 2).map((rec, i) => (
              <View key={i} style={styles.recommendation}>
                <View style={styles.recDot} />
                <Text style={styles.recText}>{rec}</Text>
              </View>
            ))}
          </GlassCard>
        )}

        {/* Bottom padding for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const QUICK_ACTIONS = [
  { label: "Water", icon: "water-outline", gradient: Colors.gradient.blue, route: "/water" },
  { label: "Workout", icon: "barbell-outline", gradient: Colors.gradient.primary, route: "/(tabs)/workouts" },
  { label: "Meal", icon: "restaurant-outline", gradient: Colors.gradient.warning, route: "/(tabs)/meals" },
  { label: "AI Coach", icon: "sparkles", gradient: Colors.gradient.purple, route: "/ai-coach" },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  scroll: { padding: 20, gap: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  greeting: { fontSize: 22, fontWeight: "700", color: Colors.text.primary },
  date: { color: Colors.text.muted, fontSize: 14, marginTop: 4 },
  aiBtn: { borderRadius: 14, overflow: "hidden" },
  aiBtnInner: { padding: 12 },
  streakBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 16,
  },
  streakText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  calorieCard: {},
  calorieContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionLabel: { color: Colors.text.muted, fontSize: 13, marginBottom: 4 },
  calorieValue: { color: Colors.text.primary, fontSize: 40, fontWeight: "800" },
  calorieUnit: { color: Colors.text.secondary, fontSize: 14, marginTop: 2 },
  macros: { marginTop: 20, gap: 10 },
  macroItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  macroLabel: { color: Colors.text.secondary, fontSize: 12, width: 52 },
  macroBar: { flex: 1, height: 6, backgroundColor: Colors.background.tertiary, borderRadius: 3, overflow: "hidden" },
  macroFill: { height: "100%", borderRadius: 3 },
  macroValue: { color: Colors.text.secondary, fontSize: 12, width: 40, textAlign: "right" },
  grid: { flexDirection: "row", gap: 12 },
  gridItem: { flex: 1 },
  sectionTitle: { color: Colors.text.primary, fontSize: 18, fontWeight: "700" },
  actions: { flexDirection: "row", justifyContent: "space-between" },
  actionBtn: { alignItems: "center", gap: 8 },
  actionIcon: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  actionLabel: { color: Colors.text.secondary, fontSize: 12, fontWeight: "500" },
  summaryCard: { marginTop: 4 },
  summaryHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  summaryTitle: { color: Colors.text.primary, fontWeight: "700", fontSize: 16 },
  summaryMsg: { color: Colors.text.secondary, fontSize: 14, lineHeight: 21, marginBottom: 12 },
  recommendation: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  recDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary, marginTop: 6 },
  recText: { flex: 1, color: Colors.text.secondary, fontSize: 14, lineHeight: 20 },
});
