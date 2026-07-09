import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { habitService, Habit } from "@/services/habitService";
import { Colors } from "@/theme/colors";

const PRESET_HABITS = [
  { name: "Morning Meditation", icon: "leaf-outline", color: Colors.accent.green },
  { name: "Read 30 mins", icon: "book-outline", color: Colors.accent.blue },
  { name: "No Sugar", icon: "nutrition-outline", color: Colors.accent.orange },
  { name: "8h Sleep", icon: "moon-outline", color: Colors.accent.purple },
];

export default function HabitsScreen() {
  const today = format(new Date(), "yyyy-MM-dd");
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");

  const { data: summary, isLoading } = useQuery({
    queryKey: ["habits", "summary", today],
    queryFn: () => habitService.getDailySummary(today),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => habitService.create({ name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["habits"] });
      setNewName("");
      setShowAdd(false);
    },
  });

  const logMutation = useMutation({
    mutationFn: ({ habitId, completed }: { habitId: string; completed: boolean }) =>
      habitService.logHabit(habitId, today, completed),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => habitService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"] }),
  });

  const completedCount = summary?.completed ?? 0;
  const totalCount = summary?.total_habits ?? 0;
  const rate = summary?.completion_rate ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Daily Habits</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.addBtn}>
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <GlassCard style={styles.summaryCard} padding={20}>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryTitle}>Today's Progress</Text>
            <Text style={styles.summaryDate}>{format(new Date(), "EEEE, MMMM d")}</Text>
          </View>
          <View style={styles.rateCircle}>
            <Text style={styles.rateText}>{Math.round(rate)}%</Text>
          </View>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${rate}%`, backgroundColor: rate >= 100 ? Colors.success : Colors.primary },
            ]}
          />
        </View>
        <Text style={styles.summaryCount}>
          {completedCount} of {totalCount} habits completed
        </Text>
      </GlassCard>

      {/* Habit list */}
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : !summary?.habits?.length ? (
        <View style={styles.empty}>
          <Ionicons name="checkmark-circle-outline" size={56} color={Colors.text.muted} />
          <Text style={styles.emptyTitle}>No habits yet</Text>
          <Text style={styles.emptyText}>Add your first habit to start tracking</Text>
          <Button label="Add Habit" onPress={() => setShowAdd(true)} style={{ marginTop: 8 }} />
        </View>
      ) : (
        <FlatList
          data={summary.habits}
          keyExtractor={(item) => item.habit.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const completed = item.log?.is_completed ?? false;
            return (
              <GlassCard style={styles.habitCard} padding={16}>
                <TouchableOpacity
                  style={styles.habitRow}
                  onPress={() =>
                    logMutation.mutate({ habitId: item.habit.id, completed: !completed })
                  }
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={completed ? Colors.gradient.success : ["#2A2A3A", "#2A2A3A"]}
                    style={styles.habitCheck}
                  >
                    <Ionicons
                      name={completed ? "checkmark" : "ellipse-outline"}
                      size={20}
                      color={completed ? "#fff" : Colors.text.muted}
                    />
                  </LinearGradient>

                  <View style={styles.habitInfo}>
                    <Text style={[styles.habitName, completed && styles.habitDone]}>
                      {item.habit.name}
                    </Text>
                    {item.habit.streak > 0 && (
                      <View style={styles.streakRow}>
                        <Ionicons name="flame" size={12} color={Colors.accent.orange} />
                        <Text style={styles.streakText}>{item.habit.streak} day streak</Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={() => deleteMutation.mutate(item.habit.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={18} color={Colors.text.muted} />
                  </TouchableOpacity>
                </TouchableOpacity>
              </GlassCard>
            );
          }}
          ListFooterComponent={<View style={{ height: 40 }} />}
        />
      )}

      {/* Add habit modal */}
      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalCard} padding={24}>
            <Text style={styles.modalTitle}>New Habit</Text>

            <TextInput
              placeholder="Habit name..."
              placeholderTextColor={Colors.text.muted}
              value={newName}
              onChangeText={setNewName}
              style={styles.input}
              autoFocus
            />

            <Text style={styles.presetsLabel}>Quick picks</Text>
            <View style={styles.presets}>
              {PRESET_HABITS.map((p) => (
                <TouchableOpacity
                  key={p.name}
                  onPress={() => setNewName(p.name)}
                  style={[styles.presetChip, newName === p.name && styles.presetChipActive]}
                >
                  <Ionicons name={p.icon as any} size={14} color={newName === p.name ? "#fff" : Colors.text.secondary} />
                  <Text style={[styles.presetText, newName === p.name && { color: "#fff" }]}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button label="Cancel" variant="ghost" onPress={() => setShowAdd(false)} style={{ flex: 1 }} />
              <Button
                label="Add"
                onPress={() => newName.trim() && createMutation.mutate(newName.trim())}
                loading={createMutation.isPending}
                style={{ flex: 1 }}
              />
            </View>
          </GlassCard>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, paddingBottom: 12 },
  title: { color: Colors.text.primary, fontSize: 22, fontWeight: "700" },
  addBtn: { padding: 4 },
  summaryCard: { marginHorizontal: 20, marginBottom: 16 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  summaryTitle: { color: Colors.text.primary, fontSize: 17, fontWeight: "700" },
  summaryDate: { color: Colors.text.muted, fontSize: 13, marginTop: 2 },
  rateCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: `${Colors.primary}20`, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: Colors.primary },
  rateText: { color: Colors.primary, fontSize: 14, fontWeight: "700" },
  progressBar: { height: 8, backgroundColor: Colors.background.tertiary, borderRadius: 4, overflow: "hidden", marginBottom: 10 },
  progressFill: { height: "100%", borderRadius: 4 },
  summaryCount: { color: Colors.text.secondary, fontSize: 13 },
  list: { paddingHorizontal: 20, paddingTop: 4 },
  loader: { marginTop: 60 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  emptyTitle: { color: Colors.text.primary, fontSize: 20, fontWeight: "700" },
  emptyText: { color: Colors.text.muted, fontSize: 15, textAlign: "center" },
  habitCard: { marginBottom: 10 },
  habitRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  habitCheck: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  habitInfo: { flex: 1, gap: 4 },
  habitName: { color: Colors.text.primary, fontSize: 15, fontWeight: "500" },
  habitDone: { color: Colors.text.muted, textDecorationLine: "line-through" },
  streakRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  streakText: { color: Colors.accent.orange, fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalCard: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  modalTitle: { color: Colors.text.primary, fontSize: 20, fontWeight: "700", marginBottom: 16 },
  input: { backgroundColor: Colors.background.tertiary, borderRadius: 12, padding: 14, color: Colors.text.primary, fontSize: 16, marginBottom: 16 },
  presetsLabel: { color: Colors.text.muted, fontSize: 13, marginBottom: 10 },
  presets: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  presetChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.background.tertiary, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  presetChipActive: { backgroundColor: Colors.primary },
  presetText: { color: Colors.text.secondary, fontSize: 13 },
  modalActions: { flexDirection: "row", gap: 12 },
});
