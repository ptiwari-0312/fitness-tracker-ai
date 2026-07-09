import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { authService, LoginPayload, RegisterPayload } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";

export function useAuth() {
  const { setTokens, setUser, logout, user, isAuthenticated } = useAuthStore();
  const qc = useQueryClient();

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: async (tokens) => {
      setTokens(tokens.access_token, tokens.refresh_token);
      const me = await authService.getMe();
      setUser(me);
      router.replace("/(tabs)/");
    },
  });

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: async (tokens) => {
      setTokens(tokens.access_token, tokens.refresh_token);
      const me = await authService.getMe();
      setUser(me);
      router.replace("/(tabs)/");
    },
  });

  const handleLogout = () => {
    logout();
    qc.clear();
    router.replace("/(auth)/login");
  };

  return {
    user,
    isAuthenticated,
    register: (data: RegisterPayload) => registerMutation.mutate(data),
    login: (data: LoginPayload) => loginMutation.mutate(data),
    logout: handleLogout,
    isRegistering: registerMutation.isPending,
    isLoggingIn: loginMutation.isPending,
    registerError: registerMutation.error,
    loginError: loginMutation.error,
  };
}
