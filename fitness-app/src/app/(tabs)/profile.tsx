import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { useWeightProgress } from "@/hooks/useFitness";
import { Colors } from "@/theme/colors";
import { patch } from "@/services/api";

const GOAL_OPTIONS = [
  { value: "weight_loss", label: "Weight Loss", icon: "trending-down-outline" },
  { value: "muscle_gain", label: "Muscle Gain", icon: "barbell-outline" },
  { value: "maintain", label: "Maintain", icon: "checkmark-circle-outline" },
];

const ACTIVITY_LEVELS = [
  { value: 1.2,   label: "Sedentary",         desc: "Little or no exercise" },
  { value: 1.375, label: "Lightly Active",     desc: "1–3 days/week" },
  { value: 1.55,  label: "Moderately Active",  desc: "3–5 days/week" },
  { value: 1.725, label: "Very Active",        desc: "6–7 days/week" },
  { value: 1.9,   label: "Extra Active",       desc: "Physical job + daily training" },
];

function calcBMR(weight: number, height: number, age: number, gender: string) {
  const male = gender === "male";
  return {
    mifflin: Math.round(
      male
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161
    ),
    harris: Math.round(
      male
        ? 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age
        : 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age
    ),
    schofield: Math.round(
      male
        ? (age < 30 ? 15.4 * weight - 27 * (height / 100) + 717
          : age < 60 ? 11.3 * weight + 16 * (height / 100) + 901
          : 8.8 * weight + 1128 * (height / 100) - 1071)
        : (age < 30 ? 13.3 * weight + 334 * (height / 100) + 35
          : age < 60 ? 8.7 * weight - 25 * (height / 100) + 865
          : 9.2 * weight + 637 * (height / 100) - 302)
    ),
  };
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { updateUser } = useAuthStore();
  const qc = useQueryClient();
  const { data: weightProgress } = useWeightProgress();
  const [activityLevel, setActivityLevel] = useState(1.55);

  const { control, handleSubmit, formState: { isDirty } } = useForm({
    defaultValues: {
      name: user?.name ?? "",
      age: String(user?.age ?? ""),
      height_cm: String(user?.height_cm ?? ""),
      weight_kg: String(user?.weight_kg ?? ""),
      target_weight_kg: String(user?.target_weight_kg ?? ""),
      gender: user?.gender ?? "male",
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: object) => patch("/users/me", data),
    onSuccess: (updated: any) => {
      updateUser(updated);
      qc.invalidateQueries({ queryKey: ["user"] });
    },
  });

  const onSave = (data: any) => {
    updateMutation.mutate({
      name: data.name,
      age: data.age ? parseInt(data.age) : undefined,
      height_cm: data.height_cm ? parseFloat(data.height_cm) : undefined,
      weight_kg: data.weight_kg ? parseFloat(data.weight_kg) : undefined,
      target_weight_kg: data.target_weight_kg ? parseFloat(data.target_weight_kg) : undefined,
      gender: data.gender,
    });
  };

  // Compute BMR from profile or latest logged weight
  const currentWeight = weightProgress?.current_weight ?? user?.weight_kg;
  const height = user?.height_cm;
  const age = user?.age;
  const gender = user?.gender ?? "male";
  const canCalc = currentWeight && height && age;

  const bmr = canCalc ? calcBMR(currentWeight!, height!, age!, gender) : null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Profile</Text>

        {/* Avatar & name */}
        <GlassCard padding={24}>
          <View style={styles.avatarSection}>
            <LinearGradient colors={Colors.gradient.primary} style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() ?? "?"}
              </Text>
            </LinearGradient>
            <View>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <View style={styles.badges}>
                <Badge label={`${user?.streak_days ?? 0} day streak`} variant="warning" />
                <Badge label={`${user?.total_points ?? 0} pts`} variant="primary" />
              </View>
            </View>
          </View>
        </GlassCard>

        {/* Goal selector */}
        <GlassCard padding={20}>
          <Text style={styles.cardTitle}>Fitness Goal</Text>
          <View style={styles.goalRow}>
            {GOAL_OPTIONS.map((g) => (
              <TouchableOpacity
                key={g.value}
                style={[styles.goalOption, user?.goal === g.value && styles.goalSelected]}
                onPress={() => updateMutation.mutate({ goal: g.value })}
              >
                <Ionicons
                  name={g.icon as any}
                  size={22}
                  color={user?.goal === g.value ? Colors.primary : Colors.text.muted}
                />
                <Text style={[styles.goalLabel, user?.goal === g.value && { color: Colors.primary }]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        {/* Body Stats form */}
        <GlassCard padding={20}>
          <Text style={styles.cardTitle}>Body Stats</Text>
          <View style={styles.form}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <Input label="Full Name" leftIcon="person-outline" value={value} onChangeText={onChange} />
              )}
            />

            {/* Gender */}
            <Controller
              control={control}
              name="gender"
              render={({ field: { onChange, value } }) => (
                <View>
                  <Text style={styles.fieldLabel}>Gender</Text>
                  <View style={styles.genderRow}>
                    {[
                      { v: "male", label: "Male", icon: "male-outline" },
                      { v: "female", label: "Female", icon: "female-outline" },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.v}
                        style={[styles.genderBtn, value === opt.v && styles.genderBtnActive]}
                        onPress={() => onChange(opt.v)}
                      >
                        <Ionicons
                          name={opt.icon as any}
                          size={18}
                          color={value === opt.v ? Colors.primary : Colors.text.muted}
                        />
                        <Text style={[styles.genderLabel, value === opt.v && { color: Colors.primary }]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            />

            <View style={styles.row}>
              <Controller control={control} name="age"
                render={({ field: { onChange, value } }) => (
                  <Input label="Age" leftIcon="calendar-outline" keyboardType="number-pad" value={value} onChangeText={onChange} containerStyle={{ flex: 1 }} />
                )}
              />
              <Controller control={control} name="height_cm"
                render={({ field: { onChange, value } }) => (
                  <Input label="Height (cm)" leftIcon="resize-outline" keyboardType="decimal-pad" value={value} onChangeText={onChange} containerStyle={{ flex: 1 }} />
                )}
              />
            </View>

            <View style={styles.row}>
              <Controller control={control} name="weight_kg"
                render={({ field: { onChange, value } }) => (
                  <Input label="Current Weight (kg)" leftIcon="scale-outline" keyboardType="decimal-pad" value={value} onChangeText={onChange} containerStyle={{ flex: 1 }} />
                )}
              />
              <Controller control={control} name="target_weight_kg"
                render={({ field: { onChange, value } }) => (
                  <Input label="Target Weight (kg)" leftIcon="flag-outline" keyboardType="decimal-pad" value={value} onChangeText={onChange} containerStyle={{ flex: 1 }} />
                )}
              />
            </View>

            <Button
              label="Save Changes"
              onPress={handleSubmit(onSave)}
              loading={updateMutation.isPending}
              fullWidth
            />
          </View>
        </GlassCard>

        {/* BMR & TDEE Card */}
        <GlassCard padding={20}>
          <View style={styles.bmrHeader}>
            <Text style={styles.cardTitle}>BMR & Daily Calories</Text>
            <Ionicons name="flame" size={20} color={Colors.accent.orange} />
          </View>

          {!canCalc ? (
            <View style={styles.bmrEmpty}>
              <Ionicons name="information-circle-outline" size={24} color={Colors.text.muted} />
              <Text style={styles.bmrEmptyText}>
                Fill in your age, height, and weight above to see your BMR
              </Text>
            </View>
          ) : (
            <>
              {/* Formula comparison */}
              <Text style={styles.bmrSubtitle}>Basal Metabolic Rate (calories at rest)</Text>
              <Text style={styles.hint}>BMR is how many calories your body burns doing absolutely nothing — just to keep you alive (breathing, heartbeat, organ function).</Text>
              <View style={styles.formulaGrid}>
                {[
                  { label: "Mifflin-St Jeor", value: bmr!.mifflin, badge: "Most accurate", desc: "Gold standard since 1990", color: Colors.primary },
                  { label: "Harris-Benedict", value: bmr!.harris, badge: "Classic", desc: "Revised 1984 formula", color: Colors.secondary },
                  { label: "Schofield", value: bmr!.schofield, badge: "WHO formula", desc: "Used by WHO & dietitians", color: Colors.accent.purple },
                ].map((f) => (
                  <View key={f.label} style={styles.formulaCard}>
                    <Text style={[styles.formulaValue, { color: f.color }]}>{f.value}</Text>
                    <Text style={styles.formulaUnit}>kcal/day</Text>
                    <Text style={styles.formulaName}>{f.label}</Text>
                    <Text style={styles.formulaDesc}>{f.desc}</Text>
                    <View style={[styles.formulaBadge, { backgroundColor: `${f.color}18` }]}>
                      <Text style={[styles.formulaBadgeText, { color: f.color }]}>{f.badge}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Activity level */}
              <Text style={[styles.bmrSubtitle, { marginTop: 20 }]}>Activity Level → TDEE</Text>
              <Text style={styles.hint}>TDEE (Total Daily Energy Expenditure) = BMR × your activity multiplier. This is your actual daily calorie burn including exercise.</Text>
              {ACTIVITY_LEVELS.map((al) => {
                const tdee = Math.round(bmr!.mifflin * al.value);
                const active = activityLevel === al.value;
                return (
                  <TouchableOpacity
                    key={al.value}
                    style={[styles.activityRow, active && styles.activityRowActive]}
                    onPress={() => setActivityLevel(al.value)}
                  >
                    <View style={styles.activityLeft}>
                      <View style={[styles.activityDot, active && { backgroundColor: Colors.primary }]} />
                      <View>
                        <Text style={[styles.activityLabel, active && { color: Colors.primary }]}>{al.label}</Text>
                        <Text style={styles.activityDesc}>{al.desc}</Text>
                      </View>
                    </View>
                    <Text style={[styles.tdeeValue, active && { color: Colors.primary }]}>{tdee} kcal</Text>
                  </TouchableOpacity>
                );
              })}

              {/* Goal-based calorie targets */}
              <View style={styles.calTargets}>
                <Text style={styles.bmrSubtitle}>Calorie Targets</Text>
                <Text style={[styles.hint, { marginBottom: 8 }]}>Eat below TDEE to lose weight, at TDEE to maintain, above TDEE to build muscle.</Text>
                {[
                  { label: "Weight Loss (−500)", value: Math.round(bmr!.mifflin * activityLevel - 500), color: Colors.info },
                  { label: "Maintenance",        value: Math.round(bmr!.mifflin * activityLevel),       color: Colors.success },
                  { label: "Muscle Gain (+300)", value: Math.round(bmr!.mifflin * activityLevel + 300), color: Colors.accent.orange },
                ].map((t) => (
                  <View key={t.label} style={styles.calRow}>
                    <View style={[styles.calDot, { backgroundColor: t.color }]} />
                    <Text style={styles.calLabel}>{t.label}</Text>
                    <Text style={[styles.calValue, { color: t.color }]}>{t.value} kcal</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </GlassCard>

        {/* Settings */}
        <GlassCard padding={4}>
          {[
            { icon: "notifications-outline", label: "Notifications" },
            { icon: "shield-outline", label: "Privacy" },
            { icon: "help-circle-outline", label: "Help & Support" },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={styles.settingsRow}>
              <Ionicons name={item.icon as any} size={20} color={Colors.text.secondary} />
              <Text style={styles.settingsLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.text.muted} />
            </TouchableOpacity>
          ))}
        </GlassCard>

        <Button
          label="Sign Out"
          onPress={logout}
          variant="ghost"
          fullWidth
          style={{ borderColor: Colors.error, borderWidth: 1 }}
        />

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  scroll: { padding: 20, gap: 16 },
  title: { color: Colors.text.primary, fontSize: 28, fontWeight: "800" },

  avatarSection: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatar: { width: 70, height: 70, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "800" },
  userName: { color: Colors.text.primary, fontSize: 20, fontWeight: "700" },
  userEmail: { color: Colors.text.muted, fontSize: 14, marginBottom: 8 },
  badges: { flexDirection: "row", gap: 8 },

  cardTitle: { color: Colors.text.primary, fontSize: 17, fontWeight: "700", marginBottom: 16 },

  goalRow: { flexDirection: "row", gap: 10 },
  goalOption: { flex: 1, alignItems: "center", gap: 8, padding: 14, borderRadius: 12, backgroundColor: Colors.background.tertiary, borderWidth: 1, borderColor: "transparent" },
  goalSelected: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}15` },
  goalLabel: { color: Colors.text.secondary, fontSize: 12, fontWeight: "500", textAlign: "center" },

  form: { gap: 14 },
  row: { flexDirection: "row", gap: 12 },
  fieldLabel: { color: Colors.text.secondary, fontSize: 13, fontWeight: "500", marginBottom: 8 },
  genderRow: { flexDirection: "row", gap: 12 },
  genderBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.background.tertiary, borderWidth: 1, borderColor: "transparent" },
  genderBtnActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}15` },
  genderLabel: { color: Colors.text.secondary, fontSize: 14, fontWeight: "600" },

  // BMR section
  bmrHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  bmrEmpty: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16, backgroundColor: Colors.background.tertiary, borderRadius: 12 },
  bmrEmptyText: { color: Colors.text.muted, fontSize: 13, flex: 1 },
  bmrSubtitle: { color: Colors.text.secondary, fontSize: 13, fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  hint: { color: Colors.text.muted, fontSize: 12, lineHeight: 17, marginBottom: 12, fontStyle: "italic" },

  formulaGrid: { flexDirection: "row", gap: 10 },
  formulaCard: { flex: 1, alignItems: "center", backgroundColor: Colors.background.tertiary, borderRadius: 14, padding: 12, gap: 2 },
  formulaValue: { fontSize: 22, fontWeight: "800" },
  formulaUnit: { color: Colors.text.muted, fontSize: 10 },
  formulaName: { color: Colors.text.secondary, fontSize: 10, textAlign: "center", marginTop: 4 },
  formulaDesc: { color: Colors.text.muted, fontSize: 9, textAlign: "center", marginTop: 1, fontStyle: "italic" },
  formulaBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  formulaBadgeText: { fontSize: 9, fontWeight: "700" },

  activityRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, borderRadius: 12, marginBottom: 6, backgroundColor: Colors.background.tertiary, borderWidth: 1, borderColor: "transparent" },
  activityRowActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}10` },
  activityLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  activityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.background.cardBorder },
  activityLabel: { color: Colors.text.primary, fontSize: 14, fontWeight: "600" },
  activityDesc: { color: Colors.text.muted, fontSize: 11, marginTop: 1 },
  tdeeValue: { color: Colors.text.secondary, fontSize: 15, fontWeight: "700" },

  calTargets: { marginTop: 16, borderTopWidth: 1, borderTopColor: Colors.background.tertiary, paddingTop: 16 },
  calRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  calDot: { width: 10, height: 10, borderRadius: 5 },
  calLabel: { flex: 1, color: Colors.text.secondary, fontSize: 14 },
  calValue: { fontSize: 15, fontWeight: "700" },

  settingsRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  settingsLabel: { flex: 1, color: Colors.text.primary, fontSize: 15 },
});
