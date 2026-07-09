/**
 * Animated circular progress ring built with react-native-svg.
 * Used for water, calorie, and habit completion indicators.
 */
import React, { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Colors } from "@/theme/colors";

interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number;         // 0-100
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ProgressRing({
  size = 120,
  strokeWidth = 10,
  progress,
  color = Colors.primary,
  trackColor = Colors.background.tertiary,
  label,
  sublabel,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: Math.min(Math.max(progress, 0), 100),
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {label && (
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: Colors.text.primary, fontWeight: "700", fontSize: 18 }}>
            {label}
          </Text>
          {sublabel && (
            <Text style={{ color: Colors.text.muted, fontSize: 11 }}>{sublabel}</Text>
          )}
        </View>
      )}
    </View>
  );
}
