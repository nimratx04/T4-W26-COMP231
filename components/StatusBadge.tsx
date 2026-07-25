import { StyleSheet, Text, View } from "react-native";
import { FONT_SIZE, RADIUS, SPACING, STATUS_STYLES, type StatusTone } from "../constants/theme";

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
};

const toneByLabel: Record<string, StatusTone> = {
  pending: "pending",
  active: "active",
  resolved: "resolved",
  verified: "verified",
  rejected: "rejected",
  expired: "expired",
  urgent: "urgent",
  high: "high",
  medium: "medium",
  low: "low",
  open: "open",
  limited: "limited",
  full: "full",
  closed: "closed",
  available: "available",
  accepted: "accepted",
  completed: "completed",
  responding: "responding",
  "pending verification": "pendingVerification",
};

export default function StatusBadge({ label, tone }: StatusBadgeProps) {
  const resolvedTone = tone ?? toneByLabel[label.toLowerCase()] ?? "active";
  const palette = STATUS_STYLES[resolvedTone];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: palette.background, borderColor: palette.border },
      ]}
    >
      <Text style={[styles.text, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  text: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "800",
  },
});
