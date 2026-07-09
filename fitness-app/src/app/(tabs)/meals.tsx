import React, { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { format, addDays, isToday, isYesterday } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { CalorieChart } from "@/components/charts/CalorieChart";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { MealPhotoLogger } from "@/components/meal/MealPhotoLogger";
import { useDailyMealLogs, useDailyNutrition } from "@/hooks/useFitness";
import { mealService } from "@/services/mealService";
import { Colors } from "@/theme/colors";
import type { MealLog } from "@/services/mealService";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
type MealType = (typeof MEAL_TYPES)[number];

const MEAL_ICONS: Record<MealType, string> = {
  breakfast: "sunny-outline",
  lunch: "partly-sunny-outline",
  dinner: "moon-outline",
  snack: "cafe-outline",
};

function dayLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEE, MMM d");
}

export default function MealsScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const isFuture = selectedDate > new Date();

  const qc = useQueryClient();
  const { data: nutrition, isLoading: nutritionLoading } = useDailyNutrition(dateStr);
  const { data: logs } = useDailyMealLogs(dateStr);

  const [addingFor, setAddingFor] = useState<MealType | null>(null);
  const [addMode, setAddMode] = useState<"text" | "photo">("text");
  const [foodText, setFoodText] = useState("");
  const [saving, setSaving] = useState(false);
  const [aiError, setAiError] = useState("");

  const resetForm = () => { setAddingFor(null); setFoodText(""); setAiError(""); setAddMode("text"); };

  const changeDay = (delta: number) => {
    setSelectedDate(d => addDays(d, delta));
    resetForm();
  };

  const goToday = () => { setSelectedDate(new Date()); resetForm(); };

  const openForm = (type: MealType, mode: "text" | "photo") => {
    if (addingFor === type && addMode === mode) { resetForm(); return; }
    setAddingFor(type);
    setAddMode(mode);
    setFoodText("");
    setAiError("");
  };

  const handleLogMeal = async () => {
    if (!foodText.trim() || !addingFor) return;
    setSaving(true);
    setAiError("");
    try {
      await mealService.logFromText(foodText.trim(), addingFor, dateStr);
      await qc.invalidateQueries({ queryKey: ["meals"] });
      resetForm();
    } catch {
      setAiError("Could not calculate nutrition. Try again or be more specific.");
    } finally {
      setSaving(false);
    }
  };

  const groupedLogs = MEAL_TYPES.reduce((acc, type) => {
    acc[type] = logs?.filter((l) => l.meal_type === type) ?? [];
    return acc;
  }, {} as Record<MealType, MealLog[]>);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Nutrition</Text>
          {!isToday(selectedDate) && (
            <TouchableOpacity onPress={goToday} style={styles.todayChip}>
              <Text style={styles.todayChipText}>Go to Today</Text>
            </TouchableOpacity>
          )}
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

        {/* Calorie donut */}
        {nutritionLoading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <GlassCard padding={20}>
            <Text style={styles.sectionTitle}>{dayLabel(selectedDate)}'s Macros</Text>
            <CalorieChart
              data={{
                protein_g: nutrition?.total_protein_g ?? 0,
                carbs_g: nutrition?.total_carbs_g ?? 0,
                fat_g: nutrition?.total_fat_g ?? 0,
                total_calories: nutrition?.total_calories ?? 0,
              }}
            />
          </GlassCard>
        )}

        {/* Meal sections */}
        {MEAL_TYPES.map((type) => {
          const entries = groupedLogs[type];
          const typeCalories = entries.reduce((s, l) => s + l.calories, 0);

          return (
            <View key={type}>
              <View style={styles.mealTypeHeader}>
                <View style={styles.mealTypeLeft}>
                  <Ionicons name={MEAL_ICONS[type] as any} size={20} color={Colors.primary} />
                  <Text style={styles.mealTypeName}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </View>
                <View style={styles.mealTypeRight}>
                  <Text style={styles.mealTypeCalories}>{Math.round(typeCalories)} kcal</Text>
                  <TouchableOpacity style={styles.addBtn} onPress={() => openForm(type, "photo")}>
                    <Ionicons
                      name={addingFor === type && addMode === "photo" ? "close" : "camera-outline"}
                      size={16} color={Colors.primary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addBtn} onPress={() => openForm(type, "text")}>
                    <Ionicons
                      name={addingFor === type && addMode === "text" ? "close" : "add"}
                      size={18} color={Colors.primary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {addingFor === type && addMode === "photo" && (
                <MealPhotoLogger
                  mealType={type}
                  logDate={dateStr}
                  onSuccess={async () => {
                    await qc.invalidateQueries({ queryKey: ["meals"] });
                    resetForm();
                  }}
                  onCancel={resetForm}
                />
              )}

              {addingFor === type && addMode === "text" && (
                <GlassCard style={styles.addForm} padding={16}>
                  <View style={styles.aiHint}>
                    <Ionicons name="sparkles" size={14} color={Colors.primary} />
                    <Text style={styles.aiHintText}>AI calculates nutrition automatically</Text>
                  </View>
                  <Input
                    value={foodText}
                    onChangeText={setFoodText}
                    placeholder="e.g. 2 chapatti, 100g dal, 1 banana"
                    leftIcon="restaurant-outline"
                    onSubmitEditing={handleLogMeal}
                    returnKeyType="done"
                  />
                  {aiError ? <Text style={styles.errorText}>{aiError}</Text> : null}
                  {saving && (
                    <View style={styles.aiLoading}>
                      <ActivityIndicator size="small" color={Colors.primary} />
                      <Text style={styles.aiLoadingText}>AI is calculating nutrition…</Text>
                    </View>
                  )}
                  <Button label="Log Meal" onPress={handleLogMeal} loading={saving} fullWidth style={{ marginTop: 12 }} />
                </GlassCard>
              )}

              {entries.length === 0 ? (
                <TouchableOpacity style={styles.emptyMeal} onPress={() => openForm(type, "text")}>
                  <Ionicons name="add-circle-outline" size={20} color={Colors.text.muted} />
                  <Text style={styles.emptyMealText}>Add {type}</Text>
                </TouchableOpacity>
              ) : (
                entries.map((log) => (
                  <GlassCard key={log.id} style={styles.logCard} padding={14}>
                    <View style={styles.logRow}>
                      <View style={styles.logInfo}>
                        <Text style={styles.logName}>{log.meal?.name ?? "Unknown"}</Text>
                        <Text style={styles.logMeta}>
                          {log.quantity} serving{log.meal?.brand ? ` · ${log.meal.brand}` : ""}
                        </Text>
                      </View>
                      <View style={styles.logMacros}>
                        <Text style={styles.logCalories}>{Math.round(log.calories)} kcal</Text>
                        <Text style={styles.logMacroText}>
                          P:{Math.round(log.protein_g)}g C:{Math.round(log.carbs_g)}g F:{Math.round(log.fat_g)}g
                        </Text>
                      </View>
                    </View>
                  </GlassCard>
                ))
              )}
            </View>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  scroll: { padding: 20, gap: 16 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: Colors.text.primary, fontSize: 28, fontWeight: "800" },
  todayChip: {
    backgroundColor: `${Colors.primary}22`,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: `${Colors.primary}44`,
  },
  todayChipText: { color: Colors.primary, fontSize: 12, fontWeight: "600" },

  dateNav: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background.secondary,
    borderRadius: 14,
    padding: 4,
  },
  navArrow: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: `${Colors.primary}18`,
  },
  navArrowDisabled: { backgroundColor: Colors.background.tertiary },
  dateCenter: { flex: 1, alignItems: "center", gap: 2 },
  dayLabel: { color: Colors.text.primary, fontSize: 16, fontWeight: "700" },
  dateSubLabel: { color: Colors.text.muted, fontSize: 12 },

  sectionTitle: { color: Colors.text.primary, fontSize: 17, fontWeight: "700", marginBottom: 16 },

  mealTypeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8, marginBottom: 8 },
  mealTypeLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  mealTypeName: { color: Colors.text.primary, fontSize: 16, fontWeight: "600", textTransform: "capitalize" },
  mealTypeRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  mealTypeCalories: { color: Colors.text.muted, fontSize: 14 },
  addBtn: { backgroundColor: `${Colors.primary}20`, borderRadius: 8, padding: 4 },

  addForm: { marginBottom: 8 },
  aiHint: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  aiHintText: { color: Colors.primary, fontSize: 12, fontWeight: "500" },
  aiLoading: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  aiLoadingText: { color: Colors.text.muted, fontSize: 13 },
  errorText: { color: Colors.error, fontSize: 13, marginTop: 6 },

  emptyMeal: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, backgroundColor: Colors.background.secondary, borderRadius: 12, borderWidth: 1, borderColor: Colors.background.cardBorder, borderStyle: "dashed" },
  emptyMealText: { color: Colors.text.muted, fontSize: 14 },

  logCard: { marginBottom: 8 },
  logRow: { flexDirection: "row", justifyContent: "space-between" },
  logInfo: { flex: 1, gap: 3 },
  logName: { color: Colors.text.primary, fontSize: 15, fontWeight: "500" },
  logMeta: { color: Colors.text.muted, fontSize: 12 },
  logMacros: { alignItems: "flex-end", gap: 3 },
  logCalories: { color: Colors.text.primary, fontSize: 15, fontWeight: "600" },
  logMacroText: { color: Colors.text.muted, fontSize: 11 },
});
