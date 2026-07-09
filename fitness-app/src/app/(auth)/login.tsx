import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Link } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { Colors } from "@/theme/colors";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const { login, isLoggingIn, loginError } = useAuth();

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => login(data);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <LinearGradient
        colors={["#0A0A0F", "#12121A"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Background orb */}
      <View style={styles.orb} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoArea}>
          <LinearGradient colors={Colors.gradient.primary} style={styles.logoIcon}>
            <Ionicons name="fitness" size={32} color="#fff" />
          </LinearGradient>
          <Text style={styles.appName}>Fitness Tracker</Text>
          <Text style={styles.tagline}>Your intelligent fitness companion</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subheading}>Sign in to continue your journey</Text>

          {loginError && (
            <View style={styles.errorBanner}>
              <Ionicons name="warning-outline" size={16} color={Colors.error} />
              <Text style={styles.errorText}>
                {(loginError as any)?.response?.data?.detail
                  ?? (loginError as any)?.message?.includes("Network")
                    ? "Cannot reach server. Check your connection."
                    : "Sign in failed. Please try again."}
              </Text>
            </View>
          )}

          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email"
                  leftIcon="mail-outline"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={value}
                  onChangeText={onChange}
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Password"
                  leftIcon="lock-closed-outline"
                  placeholder="••••••••"
                  isPassword
                  value={value}
                  onChangeText={onChange}
                  error={errors.password?.message}
                />
              )}
            />

            <Button
              label="Sign In"
              onPress={handleSubmit(onSubmit)}
              loading={isLoggingIn}
              fullWidth
              size="lg"
              style={{ marginTop: 8 }}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  orb: {
    position: "absolute",
    top: -100,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: `${Colors.primary}18`,
  },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  logoArea: { alignItems: "center", marginBottom: 40 },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  appName: { color: Colors.text.primary, fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  tagline: { color: Colors.text.muted, fontSize: 15, marginTop: 6 },
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: Colors.background.cardBorder,
    gap: 20,
  },
  heading: { color: Colors.text.primary, fontSize: 24, fontWeight: "700" },
  subheading: { color: Colors.text.secondary, fontSize: 15, marginTop: -12 },
  form: { gap: 16 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: `${Colors.error}15`,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${Colors.error}30`,
  },
  errorText: { color: Colors.error, fontSize: 14, flex: 1 },
  footer: { flexDirection: "row", justifyContent: "center" },
  footerText: { color: Colors.text.muted, fontSize: 14 },
  linkText: { color: Colors.primary, fontSize: 14, fontWeight: "600" },
});
