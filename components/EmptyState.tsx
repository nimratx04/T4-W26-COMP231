import { StyleSheet, Text, View } from "react-native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../constants/theme";
import AppButton from "./AppButton";

type EmptyStateProps = {
  title: string;
  message: string;
  icon?: string;
  actionTitle?: string;
  onAction?: () => void;
};

export default function EmptyState({
  title,
  message,
  icon = "○",
  actionTitle,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionTitle && onAction ? (
        <AppButton title={actionTitle} onPress={onAction} variant="secondary" style={styles.button} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.xxl,
  },
  icon: {
    fontSize: 38,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: "800",
    textAlign: "center",
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    textAlign: "center",
    marginTop: SPACING.sm,
  },
  button: {
    alignSelf: "stretch",
    marginTop: SPACING.lg,
  },
});
