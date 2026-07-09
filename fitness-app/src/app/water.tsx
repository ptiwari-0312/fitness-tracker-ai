import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { format } from "date-fns";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { useDailyWater, useAddWater } from "@/hooks/useFitness";
import { Colors } from "@/theme/colors";

const QUICK_AMOUNTS = [150, 200, 250, 350, 500, 750];

export default function WaterScreen() {
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: summary, isLoading } = useDailyWater(today);
  const addWater = useAddWater();

  const totalMl = summary?.total_ml ?? 0;
  const goalMl = summary?.goal_ml ?? 2500;
  const percentage = summary?.percentage ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Water Tracker</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Progress ring */}
        <GlassCard padding={28} style={styles.ringCard}>
          <View style={styles.ringCenter}>
            <ProgressRing
              size={180}
              strokeWidth={16}
              progress={percentage}
              color={Colors.accent.blue}
              label={`${(totalMl / 1000).toFixed(1)}L`}
              sublabel={`of ${(goalMl / 1000).toFixed(1)}L goal`}
            />
          </View>
          <Text style={styles.ringSubtitle}>
            {percentage >= 100
              ? "Daily goal reached! 🎉"
              : `${(goalMl - totalMl).toFixed(0)} ml remaining`}
          </Text>
        </GlassCard>

        {/* Quick add buttons */}
        <GlassCard padding={20}>
          <Text style={styles.sectionTitle}>Quick Add</Text>
          <View style={styles.quickGrid}>
            {QUICK_AMOUNTS.map((ml) => (
              <TouchableOpacity
                key={ml}
                style={styles.quickBtn}
                onPress={() => addWater.mutate({ amount_ml: ml })}
                disabled={addWater.isPending}
                activeOpacity={0.8}
              >
                <LinearGradient colors={Colors.gradient.blue} style={styles.quickBtnInner}>
                  <Ionicons name="water" size={20} color="#fff" />
                  <Text style={styles.quickBtnText}>{ml} ml</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: "Glasses (250ml)", value: Math.floor(totalMl / 250) },
            { label: "Entries today", value: summary?.entries ?? 0 },
            { label: "% of goal", value: `${Math.round(percentage)}%` },
          ].map((s) => (
            <GlassCard key={s.label} style={styles.statCard} padding={14}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </GlassCard>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingBottom: 12 },
  title: { color: Colors.text.primary, fontSize: 20, fontWeight: "700" },
  scroll: { padding: 20, gap: 16 },
  ringCard: { alignItems: "center" },
  ringCenter: { marginVertical: 8 },
  ringSubtitle: { color: Colors.text.secondary, fontSize: 15, textAlign: "center", marginTop: 12 },
  sectionTitle: { color: Colors.text.primary, fontSize: 17, fontWeight: "700", marginBottom: 16 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickBtn: { width: "30%", borderRadius: 14, overflow: "hidden" },
  quickBtnInner: { alignItems: "center", justifyContent: "center", padding: 14, gap: 6 },
  quickBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, alignItems: "center" },
  statValue: { color: Colors.text.primary, fontSize: 22, fontWeight: "700" },
  statLabel: { color: Colors.text.muted, fontSize: 11, textAlign: "center", marginTop: 4 },
});
