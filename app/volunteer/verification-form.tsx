import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import FormInput from "../../components/FormInput";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../constants/theme";
import { supabase } from "../../lib/supabase";

export default function VolunteerVerificationFormScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [idDocument, setIdDocument] = useState("");
  const [policeCheck, setPoliceCheck] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [safetyAgreement, setSafetyAgreement] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    const nextErrors: Record<string, string> = {};

    if (!name.trim()) nextErrors.name = "Enter your name.";
    if (!idDocument.trim()) nextErrors.idDocument = "Enter an ID document name or demo reference.";
    if (!policeCheck.trim()) nextErrors.policeCheck = "Enter a police-check reference or placeholder.";
    if (!emergencyContact.trim()) nextErrors.emergencyContact = "Enter an emergency contact name and phone number.";
    if (!safetyAgreement) nextErrors.safetyAgreement = "You must accept the safety agreement.";

    setErrors(nextErrors);
    setConfirmation("");

    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("volunteers").insert({
        name: name.trim(),
        email: email.trim() || null,
        id_reference: idDocument.trim(),
        police_check_reference: policeCheck.trim(),
        emergency_contact: emergencyContact.trim(),
        safety_agreement: safetyAgreement,
        status: "Pending",
        result_message: "Verification is waiting for admin review.",
      });

      if (error) {
        setErrors({
          submit: "Verification information could not be saved to Supabase. Please try again.",
        });
        return;
      }

      setConfirmation("Verification information was submitted to Supabase. Status is now Pending.");

      setName("");
      setEmail("");
      setIdDocument("");
      setPoliceCheck("");
      setEmergencyContact("");
      setSafetyAgreement(false);
      setErrors({});
    } catch {
      setErrors({
        submit: "Something went wrong while saving the verification information.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: "Volunteer Verification" }} />

      <SectionTitle
        title="Submit Verification Information"
        subtitle="This prototype stores document names or references only. It does not upload real files."
      />

      <Card accentColor={COLORS.warning} style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>Demo information only</Text>
        <Text style={styles.noticeText}>
          Do not enter real identity or police-record information in this classroom prototype.
        </Text>
      </Card>

      <FormInput
        label="Volunteer name"
        required
        placeholder="Example: Demo Volunteer"
        value={name}
        onChangeText={(value) => {
          setName(value);
          if (value.trim()) setErrors((current) => ({ ...current, name: "" }));
        }}
        error={errors.name}
      />

      <FormInput
        label="Email"
        placeholder="Example: volunteer@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <FormInput
        label="ID document placeholder"
        required
        placeholder="Example: Ontario ID - DEMO-1024"
        value={idDocument}
        onChangeText={(value) => {
          setIdDocument(value);
          if (value.trim()) setErrors((current) => ({ ...current, idDocument: "" }));
        }}
        error={errors.idDocument}
      />

      <FormInput
        label="Police-check placeholder"
        required
        placeholder="Example: Police check reference - PC-4401"
        value={policeCheck}
        onChangeText={(value) => {
          setPoliceCheck(value);
          if (value.trim()) setErrors((current) => ({ ...current, policeCheck: "" }));
        }}
        error={errors.policeCheck}
      />

      <FormInput
        label="Emergency contact"
        required
        placeholder="Name and phone number"
        value={emergencyContact}
        onChangeText={(value) => {
          setEmergencyContact(value);
          if (value.trim()) setErrors((current) => ({ ...current, emergencyContact: "" }));
        }}
        error={errors.emergencyContact}
      />

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: safetyAgreement }}
        onPress={() => {
          setSafetyAgreement((value) => !value);
          setErrors((current) => ({ ...current, safetyAgreement: "" }));
        }}
        style={[styles.checkboxRow, safetyAgreement && styles.checkboxRowSelected]}
      >
        <View style={[styles.checkbox, safetyAgreement && styles.checkboxSelected]}>
          {safetyAgreement ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>

        <Text style={styles.checkboxText}>
          I agree to follow coordinator instructions, respect privacy, and complete only tasks I can perform safely.
        </Text>
      </Pressable>

      {errors.safetyAgreement ? <Text style={styles.error}>{errors.safetyAgreement}</Text> : null}

      {errors.submit ? (
        <Card accentColor={COLORS.emergency} style={styles.errorCard}>
          <Text style={styles.errorTitle}>Database error</Text>
          <Text style={styles.errorText}>{errors.submit}</Text>
        </Card>
      ) : null}

      {confirmation ? (
        <Card accentColor={COLORS.success} style={styles.successCard}>
          <Text style={styles.successTitle}>Submitted successfully</Text>
          <Text style={styles.successText}>{confirmation}</Text>
          <AppButton
            title="View Verification Status"
            onPress={() => router.push("/volunteer/verification-status" as any)}
            variant="success"
          />
        </Card>
      ) : null}

      <AppButton
        title={isSubmitting ? "Saving..." : "Submit Verification"}
        onPress={submit}
        disabled={isSubmitting}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  noticeCard: {
    backgroundColor: COLORS.warningLight,
  },
  noticeTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: "800",
  },
  noticeText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
    marginTop: SPACING.xs,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  checkboxRowSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderColor: COLORS.borderStrong,
    borderWidth: 2,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.white,
    fontWeight: "900",
  },
  checkboxText: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  error: {
    color: COLORS.emergency,
    fontSize: FONT_SIZE.xs,
    marginBottom: SPACING.lg,
  },
  errorCard: {
    backgroundColor: COLORS.emergencyLight,
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
  successCard: {
    backgroundColor: COLORS.successLight,
  },
  successTitle: {
    color: COLORS.success,
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
  },
  successText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginVertical: SPACING.sm,
  },
});