import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../constants/theme";

type ButtonVariant = "primary" | "secondary" | "danger" | "success" | "outline" | "ghost";

type AppButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export default function AppButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  textStyle,
}: AppButtonProps) {
  const palette = variants[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.button,
        { backgroundColor: palette.background, borderColor: palette.border },
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <Text style={[styles.text, { color: palette.text }, textStyle]}>{title}</Text>
      )}
    </Pressable>
  );
}

const variants: Record<ButtonVariant, { background: string; border: string; text: string }> = {
  primary: { background: COLORS.primary, border: COLORS.primary, text: COLORS.white },
  secondary: { background: COLORS.primaryLight, border: "#90CAF9", text: COLORS.primaryDark },
  danger: { background: COLORS.emergency, border: COLORS.emergency, text: COLORS.white },
  success: { background: COLORS.success, border: COLORS.success, text: COLORS.white },
  outline: { background: COLORS.surface, border: COLORS.borderStrong, text: COLORS.text },
  ghost: { background: "transparent", border: "transparent", text: COLORS.primaryDark },
};

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginVertical: SPACING.xs,
  },
  text: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    textAlign: "center",
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.48,
  },
});
