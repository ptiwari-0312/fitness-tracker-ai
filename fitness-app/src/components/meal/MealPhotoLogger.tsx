import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { mealService, type ImageAnalysisResult } from "@/services/mealService";
import { Colors } from "@/theme/colors";

/** Fallback: fetch blob URI and convert to base64 (used when picker doesn't return base64). */
async function uriToBase64(uri: string): Promise<string> {
  const resp = await fetch(uri);
  const blob = await resp.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Strip "data:image/jpeg;base64," prefix
      resolve(dataUrl.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

type Status = "idle" | "analyzing" | "confirmed" | "logging";

interface Props {
  mealType: string;
  logDate: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MealPhotoLogger({ mealType, logDate, onSuccess, onCancel }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ImageAnalysisResult | null>(null);
  const [error, setError] = useState("");

  const pickAndAnalyze = async (fromCamera: boolean) => {
    try {
      let result: ImagePicker.ImagePickerResult;

      if (fromCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          setError("Camera permission denied.");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.6,
          allowsEditing: true,
          aspect: [4, 3],
          base64: true,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.6,
          allowsEditing: true,
          base64: true,
        });
      }

      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setError("");
      setStatus("analyzing");

      // Use base64 from picker directly (quality:0.6 keeps payload under ~300KB)
      const b64 = asset.base64 ?? await uriToBase64(asset.uri);
      const data = await mealService.analyzeImage(b64, "image/jpeg", mealType, logDate);
      setAnalysis(data);
      setStatus("confirmed");
    } catch (e: any) {
      const msg: string = e?.message ?? "";
      setError(
        msg.includes("ANTHROPIC_API_KEY")
          ? "Add your ANTHROPIC_API_KEY to backend .env to enable photo analysis."
          : "Could not analyze the photo. Please try again.",
      );
      setStatus("idle");
    }
  };

  const handleLog = async () => {
    if (!analysis) return;
    setStatus("logging");
    try {
      await mealService.logFromAnalysis(analysis, mealType, logDate);
      onSuccess();
    } catch {
      setError("Failed to log meal. Please try again.");
      setStatus("confirmed");
    }
  };

  const retake = () => {
    setStatus("idle");
    setAnalysis(null);
    setImageUri(null);
    setError("");
  };

  // ── Pick options ──────────────────────────────────────────────────────────
  if (status === "idle") {
    return (
      <GlassCard style={styles.card} padding={16}>
        <View style={styles.hint}>
          <Ionicons name="sparkles" size={14} color={Colors.primary} />
          <Text style={styles.hintText}>AI identifies foods and calculates calories</Text>
        </View>

        <View style={styles.pickRow}>
          <TouchableOpacity style={styles.pickBtn} onPress={() => pickAndAnalyze(true)}>
            <Ionicons name="camera-outline" size={28} color={Colors.primary} />
            <Text style={styles.pickLabel}>Take Photo</Text>
          </TouchableOpacity>

          <View style={styles.pickDivider} />

          <TouchableOpacity style={styles.pickBtn} onPress={() => pickAndAnalyze(false)}>
            <Ionicons name="images-outline" size={28} color={Colors.primary} />
            <Text style={styles.pickLabel}>Gallery</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Button label="Cancel" variant="ghost" onPress={onCancel} fullWidth style={{ marginTop: 8 }} />
      </GlassCard>
    );
  }

  // ── Analyzing ─────────────────────────────────────────────────────────────
  if (status === "analyzing") {
    return (
      <GlassCard style={styles.card} padding={16}>
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" /> : null}
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>AI is reading your meal…</Text>
        </View>
      </GlassCard>
    );
  }

  // ── Confirm / Logging ─────────────────────────────────────────────────────
  if (analysis) {
    return (
      <GlassCard style={styles.card} padding={16}>
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" /> : null}

        <Text style={styles.foundLabel}>Found in your meal:</Text>

        {analysis.items.map((item, i) => (
          <View key={i} style={styles.itemRow}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQty}>{item.quantity}</Text>
            </View>
            <Text style={styles.itemCal}>{Math.round(item.calories)} kcal</Text>
          </View>
        ))}

        <View style={styles.separator} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalCal}>{Math.round(analysis.total_calories)} kcal</Text>
        </View>

        <View style={styles.macroRow}>
          <Text style={styles.macroText}>P {Math.round(analysis.total_protein_g)}g</Text>
          <Text style={styles.macroText}>C {Math.round(analysis.total_carbs_g)}g</Text>
          <Text style={styles.macroText}>F {Math.round(analysis.total_fat_g)}g</Text>
          <Text style={styles.confidence}>{analysis.confidence} confidence</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.actionRow}>
          <Button
            label="Retake"
            variant="ghost"
            size="sm"
            onPress={retake}
            style={styles.actionBtn}
          />
          <Button
            label="Log Meal"
            size="sm"
            onPress={handleLog}
            loading={status === "logging"}
            style={styles.actionBtn}
          />
        </View>
      </GlassCard>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  card: { marginBottom: 8 },

  hint: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  hintText: { color: Colors.primary, fontSize: 12, fontWeight: "500" },

  pickRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background.tertiary,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  pickBtn: { flex: 1, alignItems: "center", paddingVertical: 20, gap: 8 },
  pickDivider: { width: 1, height: 60, backgroundColor: Colors.background.cardBorder },
  pickLabel: { color: Colors.text.primary, fontSize: 13, fontWeight: "500" },

  preview: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    marginBottom: 14,
    backgroundColor: Colors.background.tertiary,
  },

  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  loadingText: { color: Colors.text.secondary, fontSize: 14 },

  foundLabel: { color: Colors.text.primary, fontSize: 14, fontWeight: "600", marginBottom: 10 },

  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  itemLeft: { flex: 1 },
  itemName: { color: Colors.text.primary, fontSize: 14 },
  itemQty: { color: Colors.text.muted, fontSize: 12, marginTop: 1 },
  itemCal: { color: Colors.text.secondary, fontSize: 14, fontWeight: "500" },

  separator: { height: 1, backgroundColor: Colors.background.cardBorder, marginVertical: 10 },

  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  totalLabel: { color: Colors.text.primary, fontSize: 15, fontWeight: "700" },
  totalCal: { color: Colors.primary, fontSize: 18, fontWeight: "800" },

  macroRow: { flexDirection: "row", gap: 10, marginBottom: 14, flexWrap: "wrap" },
  macroText: { color: Colors.text.muted, fontSize: 12 },
  confidence: { color: Colors.text.muted, fontSize: 11, opacity: 0.7, marginLeft: "auto" },

  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: { flex: 1 },

  errorText: { color: Colors.error, fontSize: 13, marginBottom: 8, textAlign: "center" },
});
