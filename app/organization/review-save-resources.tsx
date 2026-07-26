import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";
import { COLORS, FONT_SIZE, SPACING } from "../../constants/theme";
import { useAppContext } from "../../context/AppContext";
import { supabase } from "../../lib/supabase";

export default function ReviewResourcesScreen() {
  const router = useRouter();
  const { resourceDraft, confirmResourceChanges } = useAppContext();

  const [confirmation, setConfirmation] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const confirm = async () => {
    setConfirmation("");
    setErrorMessage("");

    if (!resourceDraft) {
      setErrorMessage("There were no staged changes to save.");
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase.from("resources").insert({
        organization_name: "RescueBridge Shelter Partner",
        beds: resourceDraft.beds,
        food_available: String(resourceDraft.food),
        water_available: String(resourceDraft.water),
        blankets_supplies: resourceDraft.blanketsSupplies,
        medical_support: resourceDraft.medicalSupport,
        contact_number: resourceDraft.contactNumber,
        operating_hours: resourceDraft.operatingHours,
      });

      if (error) {
        setErrorMessage("Resource information could not be saved to Supabase. Please try again.");
        return;
      }

      confirmResourceChanges();
      setConfirmation("Resource information was confirmed and saved to Supabase.");
    } catch {
      setErrorMessage("Something went wrong while saving resource information.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: "Review Resource Changes" }} />

      <SectionTitle
        title="Review & Save"
        subtitle="Check every change before publishing so users do not receive incorrect information."
      />

      {errorMessage ? (
        <Card accentColor={COLORS.emergency} style={styles.errorCard}>
          <Text style={styles.errorTitle}>Database error</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </Card>
      ) : null}

      {confirmation ? (
        <Card accentColor={COLORS.success} style={styles.successCard}>
          <Text style={styles.successTitle}>Changes saved</Text>
          <Text style={styles.successText}>{confirmation}</Text>
          <AppButton
            title="Return to Organization Dashboard"
            onPress={() => router.replace("/organization" as any)}
            variant="success"
          />
        </Card>
      ) : resourceDraft ? (
        <>
          <Card accentColor={COLORS.primary}>
            <Text style={styles.cardTitle}>Resource summary</Text>

            <SummaryRow label="Beds" value={String(resourceDraft.beds)} />
            <SummaryRow label="Food units" value={String(resourceDraft.food)} />
            <SummaryRow label="Water units" value={String(resourceDraft.water)} />
            <SummaryRow label="Blankets / supplies" value={resourceDraft.blanketsSupplies} />
            <SummaryRow label="Medical support" value={resourceDraft.medicalSupport} />
            <SummaryRow label="Contact number" value={resourceDraft.contactNumber} />
            <SummaryRow label="Operating hours" value={resourceDraft.operatingHours} />
          </Card>

          <View style={styles.buttonRow}>
            <AppButton
              title="Edit"
              onPress={() => router.back()}
              variant="outline"
              style={styles.flex}
              disabled={isSaving}
            />
            <AppButton
              title={isSaving ? "Saving..." : "Confirm & Save"}
              onPress={confirm}
              variant="success"
              style={styles.flex}
              disabled={isSaving}
            />
          </View>
        </>
      ) : (
        <EmptyState
          icon="✅"
          title="No changes waiting"
          message="Open Update Resources to create a new resource update for review."
          actionTitle="Update Resources"
          onAction={() => router.push("/organization/update-resources" as any)}
        />
      )}
    </Screen>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    marginBottom: SPACING.md,
  },
  summaryRow: {
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    paddingVertical: SPACING.md,
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.xs,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  summaryValue: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    marginTop: SPACING.xs,
  },
  buttonRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  flex: {
    flex: 1,
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
});