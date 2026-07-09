import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { format, addDays, isToday, isYesterday } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { WorkoutCard } from "@/components/cards/WorkoutCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { useWorkoutLogs, useExercises, useStartWorkout } from "@/hooks/useFitness";
import { Colors } from "@/theme/colors";
import type { Exercise } from "@/services/workoutService";

type Tab = "history" | "exercises";

function dayLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEE, MMM d");
}

const CATEGORIES = ["strength", "cardio", "hiit", "core", "flexibility"];

export default function WorkoutsScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const isFuture = selectedDate > new Date();

  const [tab, setTab] = useState<Tab>("history");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [wName, setWName] = useState("");
  const [wDuration, setWDuration] = useState("30");
  const [wCalories, setWCalories] = useState("");
  const [wExerciseId, setWExerciseId] = useState<string | undefined>();
  const [sets, setSets] = useState<{ reps: string; weight: string }[]>([{ reps: "", weight: "" }]);

  const { data: logs, isLoading: logsLoading } = useWorkoutLogs(dateStr);
  const { data: exercises, isLoading: exLoading } = useExercises(search || undefined, selectedCategory);
  const startWorkout = useStartWorkout();

  const resetForm = () => {
    setShowForm(false);
    setWName(""); setWDuration("30"); setWCalories("");
    setWExerciseId(undefined);
    setSets([{ reps: "", weight: "" }]);
  };

  const changeDay = (delta: number) => { setSelectedDate(d => addDays(d, delta)); resetForm(); };
  const goToday = () => { setSelectedDate(new Date()); resetForm(); };

  const prefillFromExercise = (ex: Exercise) => {
    setWName(ex.name);
    setWExerciseId(ex.id);
    if (ex.calories_per_minute && Number(wDuration)) {
      setWCalories(String(Math.round(ex.calories_per_minute * Number(wDuration))));
    }
    setSets([{ reps: "", weight: "" }]);
    setShowForm(true);
    setTab("history");
  };

  const addSet = () => setSets(s => [...s, { reps: "", weight: "" }]);
  const removeSet = (i: number) => setSets(s => s.filter((_, idx) => idx !== i));
  const updateSet = (i: number, field: "reps" | "weight", val: string) =>
    setSets(s => s.map((row, idx) => idx === i ? { ...row, [field]: val } : row));

  const handleLog = () => {
    if (!wName.trim()) return;
    const validSets = sets
      .filter(s => s.reps.trim() !== "")
      .map(s => ({ reps: Number(s.reps), weight_kg: s.weight ? Number(s.weight) : undefined }));
    startWorkout.mutate({
      name: wName.trim(),
      duration_minutes: wDuration ? Number(wDuration) : undefined,
      calories_burned: wCalories ? Number(wCalories) : undefined,
      log_date: dateStr,
      sets: validSets.length > 0 ? validSets : undefined,
      exercise_id: wExerciseId,
    }, { onSuccess: resetForm });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Workouts</Text>
        <View style={styles.headerRight}>
          {!isToday(selectedDate) && (
            <TouchableOpacity onPress={goToday} style={styles.todayChip}>
              <Text style={styles.todayChipText}>Today</Text>
            </TouchableOpacity>
          )}
          <Button label={showForm ? "Cancel" : "+ Log"} onPress={() => setShowForm(f => !f)} size="sm" />
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

      {/* Log workout form */}
      {showForm && (
        <GlassCard style={styles.logForm} padding={16}>
          <Text style={styles.formTitle}>Log Workout for {dayLabel(selectedDate)}</Text>
          <Input
            label="Exercise / Workout name"
            value={wName}
            onChangeText={(v) => { setWName(v); setWExerciseId(undefined); }}
            placeholder="e.g. Morning Run, Bench Press"
            leftIcon="barbell-outline"
          />
          <View style={styles.rowInputs}>
            <View style={{ flex: 1 }}>
              <Input
                label="Duration (min)"
                value={wDuration}
                onChangeText={setWDuration}
                placeholder="30"
                keyboardType="numeric"
                leftIcon="time-outline"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Calories"
                value={wCalories}
                onChangeText={setWCalories}
                placeholder="optional"
                keyboardType="numeric"
                leftIcon="flame-outline"
              />
            </View>
          </View>

          {/* Sets */}
          <View style={styles.setsSection}>
            <View style={styles.setsHeader}>
              <Text style={styles.setsLabel}>Sets</Text>
              <TouchableOpacity onPress={addSet} style={styles.addSetBtn}>
                <Ionicons name="add" size={16} color={Colors.primary} />
                <Text style={styles.addSetText}>Add Set</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.setsTableHead}>
              <Text style={[styles.setCol, styles.setColNum]}>#</Text>
              <Text style={[styles.setCol, styles.setColReps]}>Reps</Text>
              <Text style={[styles.setCol, styles.setColWeight]}>kg (opt)</Text>
              <View style={{ width: 28 }} />
            </View>

            {sets.map((row, i) => (
              <View key={i} style={styles.setRow}>
                <Text style={[styles.setCol, styles.setColNum, styles.setNumText]}>{i + 1}</Text>
                <TextInput
                  style={[styles.setCol, styles.setColReps, styles.setInput]}
                  value={row.reps}
                  onChangeText={(v) => updateSet(i, "reps", v)}
                  placeholder="10"
                  placeholderTextColor={Colors.text.muted}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.setCol, styles.setColWeight, styles.setInput]}
                  value={row.weight}
                  onChangeText={(v) => updateSet(i, "weight", v)}
                  placeholder="—"
                  placeholderTextColor={Colors.text.muted}
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity
                  onPress={() => removeSet(i)}
                  disabled={sets.length === 1}
                  style={{ width: 28, alignItems: "center" }}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={sets.length === 1 ? Colors.background.tertiary : Colors.error}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <Button
            label="Log Workout"
            onPress={handleLog}
            loading={startWorkout.isPending}
            fullWidth
            style={{ marginTop: 14 }}
          />
        </GlassCard>
      )}

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(["history", "exercises"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.activeTab]}
          >
            <Text style={[styles.tabText, tab === t && styles.activeTabText]}>
              {t === "history" ? "My Workouts" : "Exercise Library"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* History tab */}
      {tab === "history" ? (
        logsLoading ? (
          <ActivityIndicator style={styles.loader} color={Colors.primary} />
        ) : !logs?.length ? (
          <View style={styles.empty}>
            <Ionicons name="barbell-outline" size={48} color={Colors.text.muted} />
            <Text style={styles.emptyTitle}>No workouts {isToday(selectedDate) ? "today" : `on ${dayLabel(selectedDate)}`}</Text>
            <Text style={styles.emptyText}>Tap "+ Log" to add a workout, or pick from the Exercise Library</Text>
          </View>
        ) : (
          <FlatList
            data={logs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <WorkoutCard workout={item} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : (
        /* Exercise Library tab */
        <View style={styles.exercisesContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color={Colors.text.muted} />
            <TextInput
              placeholder="Search exercises..."
              placeholderTextColor={Colors.text.muted}
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
          </View>

          <FlatList
            horizontal
            data={CATEGORIES}
            keyExtractor={(c) => c}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categories}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setSelectedCategory(selectedCategory === item ? undefined : item)}>
                <Badge
                  label={item}
                  variant={selectedCategory === item ? "primary" : "ghost"}
                  style={styles.categoryBadge}
                />
              </TouchableOpacity>
            )}
          />

          {exLoading ? (
            <ActivityIndicator color={Colors.primary} style={styles.loader} />
          ) : (
            <FlatList
              data={exercises}
              keyExtractor={(e) => e.id}
              renderItem={({ item: ex }) => (
                <GlassCard style={styles.exerciseCard} padding={14}>
                  <View style={styles.exRow}>
                    <LinearGradient colors={Colors.gradient.primary} style={styles.exIcon}>
                      <Ionicons name="fitness-outline" size={18} color="#fff" />
                    </LinearGradient>
                    <View style={styles.exInfo}>
                      <Text style={styles.exName}>{ex.name}</Text>
                      <Text style={styles.exMeta}>
                        {ex.muscle_groups?.replace(/,/g, " • ")} • {ex.difficulty}
                      </Text>
                      {ex.calories_per_minute && (
                        <View style={styles.exCal}>
                          <Ionicons name="flame-outline" size={12} color={Colors.accent?.orange ?? Colors.secondary} />
                          <Text style={styles.exCalText}>{ex.calories_per_minute} cal/min</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity style={styles.logThisBtn} onPress={() => prefillFromExercise(ex)}>
                      <Text style={styles.logThisText}>Log</Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              )}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingBottom: 10 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { color: Colors.text.primary, fontSize: 28, fontWeight: "800" },
  todayChip: { backgroundColor: `${Colors.primary}22`, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: `${Colors.primary}44` },
  todayChipText: { color: Colors.primary, fontSize: 12, fontWeight: "600" },

  dateNav: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginBottom: 10, backgroundColor: Colors.background.secondary, borderRadius: 14, padding: 4 },
  navArrow: { padding: 10, borderRadius: 10, backgroundColor: `${Colors.primary}18` },
  navArrowDisabled: { backgroundColor: Colors.background.tertiary },
  dateCenter: { flex: 1, alignItems: "center", gap: 2 },
  dayLabel: { color: Colors.text.primary, fontSize: 16, fontWeight: "700" },
  dateSubLabel: { color: Colors.text.muted, fontSize: 12 },

  logForm: { marginHorizontal: 20, marginBottom: 10 },
  formTitle: { color: Colors.text.primary, fontSize: 16, fontWeight: "700", marginBottom: 14 },
  rowInputs: { flexDirection: "row", gap: 10, marginTop: 10 },

  setsSection: { marginTop: 14, borderTopWidth: 1, borderTopColor: Colors.background.tertiary, paddingTop: 12 },
  setsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  setsLabel: { color: Colors.text.primary, fontSize: 14, fontWeight: "700" },
  addSetBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: `${Colors.primary}18`, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  addSetText: { color: Colors.primary, fontSize: 13, fontWeight: "600" },
  setsTableHead: { flexDirection: "row", alignItems: "center", marginBottom: 6, paddingHorizontal: 2 },
  setRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  setCol: { textAlign: "center" },
  setColNum: { width: 28 },
  setColReps: { flex: 1, marginRight: 8 },
  setColWeight: { flex: 1, marginRight: 8 },
  setNumText: { color: Colors.text.muted, fontSize: 13, fontWeight: "600" },
  setInput: { backgroundColor: Colors.background.tertiary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, color: Colors.text.primary, fontSize: 14, textAlign: "center" },

  tabRow: { flexDirection: "row", marginHorizontal: 20, backgroundColor: Colors.background.secondary, borderRadius: 12, padding: 4, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
  activeTab: { backgroundColor: Colors.background.tertiary },
  tabText: { color: Colors.text.muted, fontSize: 14, fontWeight: "500" },
  activeTabText: { color: Colors.text.primary, fontWeight: "600" },

  list: { padding: 20, paddingTop: 8, paddingBottom: 100 },
  loader: { marginTop: 40 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 40 },
  emptyTitle: { color: Colors.text.primary, fontSize: 18, fontWeight: "700", textAlign: "center" },
  emptyText: { color: Colors.text.muted, fontSize: 14, textAlign: "center" },

  exercisesContainer: { flex: 1 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 20, backgroundColor: Colors.background.tertiary, borderRadius: 12, paddingHorizontal: 14, height: 46, marginBottom: 12 },
  searchInput: { flex: 1, color: Colors.text.primary, fontSize: 15 },
  categories: { paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  categoryBadge: {},

  exerciseCard: { marginBottom: 10 },
  exRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  exIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  exInfo: { flex: 1, gap: 3 },
  exName: { color: Colors.text.primary, fontSize: 15, fontWeight: "600" },
  exMeta: { color: Colors.text.muted, fontSize: 12 },
  exCal: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  exCalText: { color: Colors.text.muted, fontSize: 11 },
  logThisBtn: { backgroundColor: `${Colors.primary}22`, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: `${Colors.primary}44` },
  logThisText: { color: Colors.primary, fontSize: 13, fontWeight: "600" },
});
