import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";
import { BorderRadius } from "@/theme/spacing";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  isPassword = false,
  ...props
}: InputProps) {
  const [secure, setSecure] = useState(isPassword);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputWrapper,
          focused && styles.focused,
          !!error && styles.errorBorder,
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={18}
            color={Colors.text.muted}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          {...props}
          secureTextEntry={secure}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, leftIcon && { paddingLeft: 0 }]}
          placeholderTextColor={Colors.text.muted}
          selectionColor={Colors.primary}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setSecure(!secure)}
            style={styles.rightIcon}
          >
            <Ionicons
              name={secure ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={Colors.text.muted}
            />
          </TouchableOpacity>
        )}

        {!isPassword && rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <Ionicons name={rightIcon} size={18} color={Colors.text.muted} />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    color: Colors.text.secondary,
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.background.cardBorder,
    paddingHorizontal: 14,
    height: 52,
  },
  focused: { borderColor: Colors.primary },
  errorBorder: { borderColor: Colors.error },
  leftIcon: { marginRight: 10 },
  rightIcon: { marginLeft: 10, padding: 2 },
  input: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 15,
    height: "100%",
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 2,
  },
});
