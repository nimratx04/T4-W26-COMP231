import type { PropsWithChildren } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { COLORS, RADIUS, SHADOWS, SPACING } from "../constants/theme";

type CardProps = PropsWithChildren<{
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accentColor?: string;
}>;

export default function Card({ children, onPress, style, accentColor }: CardProps) {
  const cardStyle = [
    styles.card,
    accentColor ? { borderLeftColor: accentColor, borderLeftWidth: 4 } : null,
    style,
  ];

  if (!onPress) {
    return <View style={cardStyle}>{children}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [cardStyle, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.995 }],
  },
});
