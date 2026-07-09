/**
 * AI Coach chat screen — full conversational interface.
 * Presented as a modal from the dashboard FAB.
 */
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
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
import { useMutation } from "@tanstack/react-query";
import Markdown from "react-native-markdown-display";
import { GlassCard } from "@/components/ui/GlassCard";
import { aiService, ChatResponse } from "@/services/aiService";
import { Colors } from "@/theme/colors";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
}

const SUGGESTED_PROMPTS = [
  "I only have 20 minutes to workout",
  "Suggest a vegetarian lunch",
  "My knees hurt, what can I do?",
  "Review my progress this week",
];

export default function AICoachScreen() {
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    aiService.newSession().then((r) => setSessionId(r.session_id));
  }, []);

  const chatMutation = useMutation({
    mutationFn: (message: string) => aiService.chat(sessionId, message),
    onSuccess: (response: ChatResponse) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: response.message,
          suggestions: response.suggestions,
        },
      ]);
    },
  });

  const send = (text: string) => {
    if (!text.trim() || !sessionId) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    chatMutation.mutate(text.trim());
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-down" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <LinearGradient colors={Colors.gradient.primary} style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={18} color="#fff" />
          </LinearGradient>
          <View>
            <Text style={styles.headerTitle}>AI Coach</Text>
            <Text style={styles.headerSub}>Powered by AI</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <LinearGradient colors={Colors.gradient.primary} style={styles.emptyChatIcon}>
                <Ionicons name="chatbubbles-outline" size={32} color="#fff" />
              </LinearGradient>
              <Text style={styles.emptyChatTitle}>Your AI Fitness Coach</Text>
              <Text style={styles.emptyChatText}>
                Ask me anything about workouts, nutrition, or your progress.
              </Text>

              {/* Suggested prompts */}
              <View style={styles.suggestions}>
                {SUGGESTED_PROMPTS.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={styles.suggestion}
                    onPress={() => send(p)}
                  >
                    <Text style={styles.suggestionText}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <View>
              <View
                style={[
                  styles.bubble,
                  item.role === "user" ? styles.userBubble : styles.aiBubble,
                ]}
              >
                {item.role === "assistant" && (
                  <LinearGradient colors={Colors.gradient.primary} style={styles.smallAvatar}>
                    <Ionicons name="sparkles" size={12} color="#fff" />
                  </LinearGradient>
                )}
                <View
                  style={[
                    styles.bubbleContent,
                    item.role === "user" ? styles.userContent : styles.aiContent,
                  ]}
                >
                  {item.role === "assistant" ? (
                    <Markdown style={markdownStyles}>{item.content}</Markdown>
                  ) : (
                    <Text style={[styles.bubbleText, { color: "#fff" }]}>{item.content}</Text>
                  )}
                </View>
              </View>

              {/* Quick reply chips */}
              {item.suggestions && item.suggestions.length > 0 && (
                <View style={styles.chips}>
                  {item.suggestions.map((s: string) => (
                    <TouchableOpacity
                      key={s}
                      style={styles.chip}
                      onPress={() => send(s)}
                    >
                      <Text style={styles.chipText}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        />

        {/* Typing indicator */}
        {chatMutation.isPending && (
          <View style={styles.typing}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.typingText}>AI Coach is thinking...</Text>
          </View>
        )}

        {/* Input bar */}
        <GlassCard style={styles.inputBar} padding={10}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask your AI coach..."
            placeholderTextColor={Colors.text.muted}
            style={styles.input}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => send(input)}
          />
          <TouchableOpacity
            onPress={() => send(input)}
            disabled={!input.trim() || chatMutation.isPending}
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          >
            <LinearGradient colors={Colors.gradient.primary} style={styles.sendBtnInner}>
              <Ionicons name="send" size={16} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </GlassCard>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.background.cardBorder },
  backBtn: { padding: 4 },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 10 },
  aiAvatar: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: Colors.text.primary, fontSize: 17, fontWeight: "700" },
  headerSub: { color: Colors.text.muted, fontSize: 12 },
  messages: { padding: 16, gap: 12, flexGrow: 1, paddingBottom: 8 },
  emptyChat: { flex: 1, alignItems: "center", paddingTop: 40, gap: 12, paddingHorizontal: 20 },
  emptyChatIcon: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  emptyChatTitle: { color: Colors.text.primary, fontSize: 22, fontWeight: "700", textAlign: "center" },
  emptyChatText: { color: Colors.text.secondary, fontSize: 15, textAlign: "center", lineHeight: 22 },
  suggestions: { width: "100%", gap: 10, marginTop: 16 },
  suggestion: { backgroundColor: Colors.background.tertiary, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.background.cardBorder },
  suggestionText: { color: Colors.text.secondary, fontSize: 14 },
  bubble: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 4 },
  userBubble: { flexDirection: "row-reverse" },
  aiBubble: {},
  smallAvatar: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  bubbleContent: { maxWidth: "80%", borderRadius: 18, padding: 14 },
  userContent: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  aiContent: { backgroundColor: Colors.background.tertiary, borderBottomLeftRadius: 4 },
  bubbleText: { color: Colors.text.primary, fontSize: 15, lineHeight: 21 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginLeft: 36, marginBottom: 8 },
  chip: { backgroundColor: `${Colors.primary}20`, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: `${Colors.primary}40` },
  chipText: { color: Colors.primary, fontSize: 13, fontWeight: "500" },
  typing: { flexDirection: "row", alignItems: "center", gap: 8, padding: 16, paddingTop: 4 },
  typingText: { color: Colors.text.muted, fontSize: 13 },
  inputBar: { margin: 12, flexDirection: "row", alignItems: "flex-end", gap: 10 },
  input: { flex: 1, color: Colors.text.primary, fontSize: 15, maxHeight: 100, paddingVertical: 4 },
  sendBtn: { flexShrink: 0 },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnInner: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});

// react-native-markdown-display styles keyed by markdown node type, not RN style groups —
// kept separate from `styles` (StyleSheet.create) since the shape is different. Matches
// bubbleText's color/size/line-height so assistant messages read the same whether or not
// the model happened to use markdown syntax.
const markdownStyles = {
  body: { color: Colors.text.primary, fontSize: 15, lineHeight: 21 },
  paragraph: { marginTop: 0, marginBottom: 8 },
  strong: { fontWeight: "700" as const },
  em: { fontStyle: "italic" as const },
  heading1: { color: Colors.text.primary, fontSize: 18, fontWeight: "700" as const, marginBottom: 6 },
  heading2: { color: Colors.text.primary, fontSize: 16, fontWeight: "700" as const, marginBottom: 6 },
  heading3: { color: Colors.text.primary, fontSize: 15, fontWeight: "700" as const, marginBottom: 6 },
  bullet_list: { marginBottom: 8 },
  ordered_list: { marginBottom: 8 },
  list_item: { marginBottom: 2 },
  bullet_list_icon: { color: Colors.text.primary },
  code_inline: {
    backgroundColor: Colors.background.primary,
    color: Colors.text.primary,
    borderRadius: 4,
    paddingHorizontal: 4,
  },
};
