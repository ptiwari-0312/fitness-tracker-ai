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
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Must be at least 8 characters")
    .regex(/\d/, "Must contain at least one number"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords don't match",
});

type FormData = z.infer<typeof schema>;

export default function RegisterScreen() {
  const { register, isRegistering, registerError } = useAuth();

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = ({ name, email, password }: FormData) =>
    register({ name, email, password });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <LinearGradient colors={["#0A0A0F", "#12121A"]} style={StyleSheet.absoluteFill} />
      <View style={styles.orb} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <LinearGradient colors={Colors.gradient.primary} style={styles.logoIcon}>
            <Ionicons name="fitness" size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.heading}>Create Account</Text>
          <Text style={styles.subheading}>Start your fitness journey today</Text>
        </View>

        <View style={styles.card}>
          {registerError && (
            <View style={styles.errorBanner}>
              <Ionicons name="warning-outline" size={16} color={Colors.error} />
              <Text style={styles.errorText}>
                {(registerError as any)?.response?.data?.detail ?? "Registration failed"}
              </Text>
            </View>
          )}

          <View style={styles.form}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Full Name"
                  leftIcon="person-outline"
                  placeholder="Alex Johnson"
                  autoCapitalize="words"
                  value={value}
                  onChangeText={onChange}
                  error={errors.name?.message}
                />
              )}
            />

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
                  placeholder="At least 8 characters"
                  isPassword
                  value={value}
                  onChangeText={onChange}
                  error={errors.password?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Confirm Password"
                  leftIcon="shield-checkmark-outline"
                  placeholder="Repeat password"
                  isPassword
                  value={value}
                  onChangeText={onChange}
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            <Button
              label="Create Account"
              onPress={handleSubmit(onSubmit)}
              loading={isRegistering}
              fullWidth
              size="lg"
              style={{ marginTop: 8 }}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Sign In</Text>
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
    bottom: -120,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: `${Colors.secondary}12`,
  },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  header: { alignItems: "center", marginBottom: 32, gap: 8 },
  logoIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  heading: { color: Colors.text.primary, fontSize: 26, fontWeight: "700" },
  subheading: { color: Colors.text.muted, fontSize: 15 },
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: Colors.background.cardBorder,
    gap: 20,
  },
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
