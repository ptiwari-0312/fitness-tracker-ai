/**
 * Root layout — initialises React Query, checks auth state,
 * and redirects to the correct navigator on mount.
 */
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StyleSheet } from "react-native";
import { Colors } from "@/theme/colors";

// Suppress React Native Web prop warnings that are non-fatal in the dev overlay
if (typeof window !== "undefined") {
  const originalError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const msg = typeof args[0] === "string" ? args[0] : "";
    if (
      msg.includes("collapsable") ||
      msg.includes("non-boolean attribute") ||
      msg.includes("aria-") ||
      msg.includes("pointerEvents") ||
      msg.includes("does not recognize") ||
      msg.includes("accessib")
    ) return;
    originalError(...args);
  };
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 2 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.root}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background.primary } }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="ai-coach" options={{ presentation: "modal" }} />
          <Stack.Screen name="water" options={{ presentation: "modal" }} />
          <Stack.Screen name="habits" />
        </Stack>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
