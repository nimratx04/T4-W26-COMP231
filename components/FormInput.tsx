import type { TextInputProps } from "react-native";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../constants/theme";

type FormInputProps = TextInputProps & {
  label: string;
  error?: string;
  required?: boolean;
};

export default function FormInput({ label, error, required = false, multiline, style, ...props }: FormInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={COLORS.textMuted}
        style={[
          styles.input,
          multiline && styles.multiline,
          error && styles.inputError,
          style,
        ]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  label: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    marginBottom: SPACING.sm,
  },
  required: {
    color: COLORS.emergency,
  },
  input: {
    minHeight: 50,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.borderStrong,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    color: COLORS.text,
    fontSize: FONT_SIZE.md,
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: COLORS.emergency,
  },
  error: {
    color: COLORS.emergency,
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.xs,
  },
});
