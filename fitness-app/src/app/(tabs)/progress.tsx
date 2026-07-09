import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { format, addDays, isToday, isYesterday } from "date-fns";
import { WeightChart } from "@/components/charts/WeightChart";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { useWeightProgress, useLogWeight, useDailyWater, useAddWater } from "@/hooks/useFitness";
import { useAuthStore } from "@/store/authStore";
import { Colors } from "@/theme/colors";

function dayLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEE, MMM d");
}

const schema = z.object({
  weight: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Enter a valid weight"),
});

const WATER_AMOUNTS = [150, 200, 250, 350, 500, 750];

export default function ProgressScreen() {
  const user = useAuthStore((s) => s.user);
  const { data: progress, isLoading } = useWeightProgress();
  const logWeight = useLogWeight();

  const [showWeightForm, setShowWeightForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const isFuture = selectedDate > new Date();

  const { data: waterSummary } = useDailyWater(dateStr);
  const addWater = useAddWater();

  const totalMl = waterSummary?.total_ml ?? 0;
  const goalMl = waterSummary?.goal_ml ?? 2500;
  const waterPct = waterSummary?.percentage ?? 0;

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { weight: "" },
  });

  const changeDay = (delta: number) => {
    setSelectedDate(d => addDays(d, delta));
    reset();
    setShowWeightForm(false);
  };
  const goToday = () => { setSelectedDate(new Date()); reset(); setShowWeightForm(false); };

  const onLogWeight = ({ weight }: { weight: string }) => {
    logWeight.mutate(
      { weight_kg: parseFloat(weight), log_date: dateStr },
      {
        onSuccess: () => { reset(); setShowWeightForm(false); },
        onError: () => Alert.alert("Error", "Could not save weight. Please try again."),
      }
    );
  };

  const handleAddWater = (ml: number) => {
    addWater.mutate(
      { amount_ml: ml, date: dateStr },
      {
        onError: () => Alert.alert("Error", "Could not log water. Please try again."),
      }
    );
  };

  const bmiCategory = progress?.bmi
    ? progress.bmi < 18.5 ? "Underweight"
    : progress.bmi < 25 ? "Normal"
    : progress.bmi < 30 ? "Overweight" : "Obese"
    : null;

  const bmiColor = bmiCategory === "Normal" ? Colors.success
    : bmiCategory === "Underweight" ? Colors.info
    : Colors.warning;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
          <View style={styles.headerRight}>
            {!isToday(selectedDate) && (
              <TouchableOpacity onPress={goToday} style={styles.todayChip}>
                <Text style={styles.todayChipText}>Today</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Date navigator */}
        <View style={styles.dateNav}>
          <TouchableOpacity style={styles.navArrow} onPress={() => changeDay(-1)}>
            <Ionicons name="chevron-back" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <View style={styles.dateCenter}>
            <Text style={styles.dayLabel}>{dayLabel(selectedDate)}</Text>
            <Text style={styles.dateSubLabel}>{format(selectedDate, "MMMM d, yyyy")}</Text>
          </View>
          <TouchableOpacity
            style={[styles.navArrow, isFuture && styles.navArrowDisabled]}
            onPress={() => !isFuture && changeDay(1)}
            disabled={isFuture}
          >
            <Ionicons name="chevron-forward" size={20} color={isFuture ? Colors.text.muted : Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* ── WATER SECTION ── */}
        <GlassCard padding={20}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionLeft}>
              <Ionicons name="water" size={20} color={Colors.accent.blue} />
              <Text style={styles.sectionTitle}>Hydration</Text>
            </View>
            <Text style={styles.waterTotal}>
              {(totalMl / 1000).toFixed(1)}L / {(goalMl / 1000).toFixed(1)}L
            </Text>
          </View>

          {/* Progress bar */}
          <View style={styles.waterBarBg}>
            <View style={[styles.waterBarFill, { width: `${Math.min(waterPct, 100)}%` as any }]} />
          </View>
          <Text style={styles.waterPctText}>
            {waterPct >= 100 ? "Goal reached!" : `${Math.round(waterPct)}% of daily goal`}
          </Text>

          {/* Quick add buttons */}
          <Text style={styles.quickLabel}>Quick Add</Text>
          <View style={styles.waterGrid}>
            {WATER_AMOUNTS.map((ml) => (
              <TouchableOpacity
                key={ml}
                style={styles.waterBtn}
                onPress={() => handleAddWater(ml)}
                disabled={addWater.isPending}
                activeOpacity={0.75}
              >
                <LinearGradient colors={Colors.gradient.blue} style={styles.waterBtnInner}>
                  <Ionicons name="water-outline" size={16} color="#fff" />
                  <Text style={styles.waterBtnText}>{ml} ml</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        {/* ── WEIGHT SECTION ── */}
        <GlassCard padding={20}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionLeft}>
              <Ionicons name="scale-outline" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Weight</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowWeightForm(f => !f)}
              style={styles.addWeightBtn}
            >
              <Ionicons name={showWeightForm ? "close" : "add"} size={18} color={Colors.primary} />
              <Text style={styles.addWeightText}>{showWeightForm ? "Cancel" : "Log"}</Text>
            </TouchableOpacity>
          </View>

          {/* Weight stats */}
          <View style={styles.statsRow}>
            {[
              { label: "Current", value: progress?.current_weight?.toFixed(1), unit: "kg" },
              { label: "Target", value: user?.target_weight_kg?.toFixed(1) ?? "—", unit: "kg" },
              { label: "Change", value: progress?.total_change != null ? `${progress.total_change > 0 ? "+" : ""}${progress.total_change.toFixed(1)}` : "—", unit: "kg" },
            ].map((stat) => (
              <View key={stat.label} style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value ?? "—"}</Text>
                <Text style={styles.statUnit}>{stat.unit}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Log weight form */}
          {showWeightForm && (
            <View style={styles.weightForm}>
              <Controller
                control={control}
                name="weight"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label={`Weight for ${dayLabel(selectedDate)} (kg)`}
                    placeholder="e.g. 72.5"
                    keyboardType="decimal-pad"
                    leftIcon="scale-outline"
                    value={value}
                    onChangeText={onChange}
                    error={errors.weight?.message}
                  />
                )}
              />
              <Button
                label="Save Weight"
                onPress={handleSubmit(onLogWeight)}
                loading={logWeight.isPending}
                fullWidth
                style={{ marginTop: 12 }}
              />
            </View>
          )}
        </GlassCard>

        {/* BMI */}
        {progress?.bmi && (
          <GlassCard padding={20}>
            <View style={styles.bmiRow}>
              <View>
                <Text style={styles.sectionTitle}>BMI</Text>
                <Text style={[styles.bmiValue, { color: bmiColor }]}>{progress.bmi}</Text>
              </View>
              {bmiCategory && (
                <Badge
                  label={bmiCategory}
                  variant={bmiCategory === "Normal" ? "success" : "warning"}
                />
              )}
            </View>
            <View style={styles.bmiScale}>
              {[
                { label: "Under", color: Colors.info },
                { label: "Normal", color: Colors.success },
                { label: "Over", color: Colors.warning },
                { label: "Obese", color: Colors.error },
              ].map((range) => (
                <View key={range.label} style={{ flex: 1 }}>
                  <View style={[styles.bmiSegment, { backgroundColor: range.color }]} />
                  <Text style={styles.bmiSegLabel}>{range.label}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        )}

        {/* Weight chart */}
        <GlassCard padding={20}>
          <Text style={styles.sectionTitle}>Weight History</Text>
          <View style={{ marginTop: 16 }}>
            <WeightChart
              logs={progress?.logs ?? []}
              target={user?.target_weight_kg}
            />
          </View>
        </GlassCard>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  scroll: { padding: 20, gap: 16 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { color: Colors.text.primary, fontSize: 28, fontWeight: "800" },
  todayChip: { backgroundColor: `${Colors.primary}22`, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: `${Colors.primary}44` },
  todayChipText: { color: Colors.primary, fontSize: 12, fontWeight: "600" },

  dateNav: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.background.secondary, borderRadius: 14, padding: 4 },
  navArrow: { padding: 10, borderRadius: 10, backgroundColor: `${Colors.primary}18` },
  navArrowDisabled: { backgroundColor: Colors.background.tertiary },
  dateCenter: { flex: 1, alignItems: "center", gap: 2 },
  dayLabel: { color: Colors.text.primary, fontSize: 16, fontWeight: "700" },
  dateSubLabel: { color: Colors.text.muted, fontSize: 12 },

  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { color: Colors.text.primary, fontSize: 17, fontWeight: "700" },

  // Water
  waterTotal: { color: Colors.accent.blue, fontSize: 14, fontWeight: "600" },
  waterBarBg: { height: 10, backgroundColor: Colors.background.tertiary, borderRadius: 5, overflow: "hidden", marginBottom: 6 },
  waterBarFill: { height: "100%", backgroundColor: Colors.accent.blue, borderRadius: 5 },
  waterPctText: { color: Colors.text.muted, fontSize: 12, marginBottom: 16 },
  quickLabel: { color: Colors.text.secondary, fontSize: 13, fontWeight: "600", marginBottom: 10 },
  waterGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  waterBtn: { width: "30%", borderRadius: 12, overflow: "hidden" },
  waterBtnInner: { alignItems: "center", justifyContent: "center", paddingVertical: 12, gap: 4 },
  waterBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  // Weight
  addWeightBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: `${Colors.primary}18`, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: `${Colors.primary}33` },
  addWeightText: { color: Colors.primary, fontSize: 13, fontWeight: "600" },
  statsRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 4 },
  statItem: { alignItems: "center", gap: 2 },
  statValue: { color: Colors.text.primary, fontSize: 22, fontWeight: "700" },
  statUnit: { color: Colors.text.muted, fontSize: 12 },
  statLabel: { color: Colors.text.muted, fontSize: 11 },
  weightForm: { marginTop: 16, borderTopWidth: 1, borderTopColor: Colors.background.tertiary, paddingTop: 16 },

  // BMI
  bmiRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  bmiValue: { fontSize: 36, fontWeight: "800", marginTop: 4 },
  bmiScale: { flexDirection: "row", gap: 4 },
  bmiSegment: { height: 6, borderRadius: 3, marginBottom: 4 },
  bmiSegLabel: { color: Colors.text.muted, fontSize: 9, textAlign: "center" },
});
