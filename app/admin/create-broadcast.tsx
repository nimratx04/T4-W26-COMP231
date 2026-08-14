import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import FormInput from "../../components/FormInput";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";
import SelectOption from "../../components/SelectOption";
import { COLORS, FONT_SIZE, SPACING } from "../../constants/theme";
import { supabase } from "../../lib/supabase";
import type { Priority } from "../../types";

const priorities: Priority[] = ["Low", "Medium", "High", "Urgent"];

// Validation constants
const MIN_TITLE_LENGTH = 3;
const MAX_TITLE_LENGTH = 100;
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_TARGET_AREA_LENGTH = 200;

export default function CreateBroadcastScreen() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetArea, setTargetArea] = useState("");
  const [priority, setPriority] = useState<Priority | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (field: string, value: string): string | null => {
    switch (field) {
      case "title":
        if (!value.trim()) return "Enter a broadcast title.";
        if (value.trim().length < MIN_TITLE_LENGTH) {
          return `Title must be at least ${MIN_TITLE_LENGTH} characters.`;
        }
        if (value.trim().length > MAX_TITLE_LENGTH) {
          return `Title must be less than ${MAX_TITLE_LENGTH} characters.`;
        }
        return null;

      case "message":
        if (!value.trim()) return "Enter the broadcast message.";
        if (value.trim().length < MIN_MESSAGE_LENGTH) {
          return `Message must be at least ${MIN_MESSAGE_LENGTH} characters.`;
        }
        if (value.trim().length > MAX_MESSAGE_LENGTH) {
          return `Message must be less than ${MAX_MESSAGE_LENGTH} characters.`;
        }
        return null;

      case "targetArea":
        if (!value.trim()) return "Enter a target area.";
        if (value.trim().length > MAX_TARGET_AREA_LENGTH) {
          return `Target area must be less than ${MAX_TARGET_AREA_LENGTH} characters.`;
        }
        return null;

      default:
        return null;
    }
  };

  const handleFieldChange = (field: string, value: string, setter: (val: string) => void) => {
    setter(value);
    const error = validateField(field, value);
    setErrors((current) => ({ ...current, [field]: error || "" }));
  };

  const submit = async () => {
    const nextErrors: Record<string, string> = {};

    // Validate all fields
    const titleError = validateField("title", title);
    if (titleError) nextErrors.title = titleError;

    const messageError = validateField("message", message);
    if (messageError) nextErrors.message = messageError;

    const targetError = validateField("targetArea", targetArea);
    if (targetError) nextErrors.targetArea = targetError;

    if (!priority) nextErrors.priority = "Select a priority level.";

    setErrors(nextErrors);
    setConfirmation("");

    if (Object.keys(nextErrors).length > 0 || !priority) return;

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("broadcasts")
        .insert({
          title: title.trim(),
          message: message.trim(),
          target_area: targetArea.trim(),
          priority: priority,
        })
        .select("id")
        .single();

      if (error) {
        setErrors({
          submit: "Broadcast could not be saved. Please try again.",
        });
        return;
      }

      // Also add to alerts table
      await supabase.from("alerts").insert({
        title: title.trim(),
        message: message.trim(),
        area: targetArea.trim(),
        priority: priority,
        type: "Emergency",
        instructions: "Follow the instructions above.",
      });

      setConfirmation(`Broadcast "${title.trim()}" was sent to ${targetArea.trim()}.`);
      setTitle("");
      setMessage("");
      setTargetArea("");
      setPriority(null);
      setErrors({});
    } catch {
      setErrors({
        submit: "Something went wrong while sending the broadcast.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: "Emergency Broadcast" }} />

      <SectionTitle
        title="Create Emergency Broadcast"
        subtitle="Send important emergency information to users in a specific area."
      />

      <Card accentColor={COLORS.emergency} style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>⚠️ Broadcast only verified information</Text>
        <Text style={styles.noticeText}>
          Use this feature for urgent, verified emergency information only.
        </Text>
        <Text style={styles.noticeText}>
          Title: {MIN_TITLE_LENGTH}-{MAX_TITLE_LENGTH} chars • Message: {MIN_MESSAGE_LENGTH}-{MAX_MESSAGE_LENGTH} chars
        </Text>
      </Card>

      <FormInput
        label="Broadcast title"
        required
        placeholder={`Enter title (${MIN_TITLE_LENGTH}-${MAX_TITLE_LENGTH} characters)`}
        value={title}
        onChangeText={(value) => handleFieldChange("title", value, setTitle)}
        error={errors.title}
        maxLength={MAX_TITLE_LENGTH}
      />

      <FormInput
        label="Message"
        required
        placeholder={`Describe the situation (${MIN_MESSAGE_LENGTH}-${MAX_MESSAGE_LENGTH} characters)`}
        value={message}
        onChangeText={(value) => handleFieldChange("message", value, setMessage)}
        multiline
        maxLength={MAX_MESSAGE_LENGTH}
        error={errors.message}
      />

      <FormInput
        label="Target area"
        required
        placeholder={`Example: Scarborough, North York (max ${MAX_TARGET_AREA_LENGTH} chars)`}
        value={targetArea}
        onChangeText={(value) => handleFieldChange("targetArea", value, setTargetArea)}
        error={errors.targetArea}
        maxLength={MAX_TARGET_AREA_LENGTH}
      />

      <Text style={styles.label}>Priority *</Text>
      <View style={styles.grid}>
        {priorities.map((item) => (
          <View key={item} style={styles.half}>
            <SelectOption
              label={item}
              description={
                item === "Urgent"
                  ? "Immediate attention needed"
                  : item === "High"
                  ? "Needs attention soon"
                  : item === "Medium"
                  ? "Important information"
                  : "For awareness"
              }
              selected={priority === item}
              onPress={() => {
                setPriority(item);
                setErrors((current) => ({ ...current, priority: "" }));
              }}
            />
          </View>
        ))}
      </View>
      {errors.priority ? <Text style={styles.error}>{errors.priority}</Text> : null}

      {errors.submit ? (
        <Card accentColor={COLORS.emergency} style={styles.errorCard}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{errors.submit}</Text>
        </Card>
      ) : null}

      {confirmation ? (
        <Card accentColor={COLORS.success} style={styles.confirmation}>
          <Text style={styles.confirmationTitle}>Broadcast sent</Text>
          <Text style={styles.confirmationText}>{confirmation}</Text>
          <AppButton
            title="Create Another Broadcast"
            onPress={() => {
              setConfirmation("");
              setTitle("");
              setMessage("");
              setTargetArea("");
              setPriority(null);
            }}
            variant="secondary"
          />
        </Card>
      ) : null}

      <AppButton
        title={isSubmitting ? "Sending..." : "Send Broadcast"}
        onPress={submit}
        variant="danger"
        disabled={isSubmitting}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  noticeCard: {
    backgroundColor: COLORS.emergencyLight,
  },
  noticeTitle: {
    color: COLORS.emergencyDark,
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
  },
  noticeText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
    marginTop: SPACING.xs,
  },
  label: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: "800",
    marginBottom: SPACING.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -SPACING.xs,
    marginBottom: SPACING.sm,
  },
  half: {
    width: "50%",
    paddingHorizontal: SPACING.xs,
  },
  error: {
    color: COLORS.emergency,
    fontSize: FONT_SIZE.xs,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.lg,
  },
  errorCard: {
    backgroundColor: COLORS.emergencyLight,
    marginTop: SPACING.sm,
  },
  errorTitle: {
    color: COLORS.emergencyDark,
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    marginTop: SPACING.xs,
  },
  confirmation: {
    backgroundColor: COLORS.successLight,
    marginTop: SPACING.sm,
  },
  confirmationTitle: {
    color: COLORS.success,
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
  },
  confirmationText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    marginVertical: SPACING.sm,
  },
});