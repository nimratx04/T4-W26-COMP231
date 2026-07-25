import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../constants/theme";

type SelectOptionProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  description?: string;
  disabled?: boolean;
  compact?: boolean;
};

export default function SelectOption({
  label,
  selected,
  onPress,
  description,
  disabled = false,
  compact = false,
}: SelectOptionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.option,
        compact && styles.compact,
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  compact: {
    flex: 1,
    minWidth: 120,
    marginRight: SPACING.sm,
  },
  selected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  disabled: {
    opacity: 0.48,
  },
  pressed: {
    opacity: 0.8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  radioSelected: {
    borderColor: COLORS.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  textWrap: {
    flex: 1,
  },
  label: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
  },
  labelSelected: {
    color: COLORS.primaryDark,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    lineHeight: 17,
    marginTop: 2,
  },
});
