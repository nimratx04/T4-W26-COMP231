import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import FormInput from "../../components/FormInput";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";
import SelectOption from "../../components/SelectOption";
import StatusBadge from "../../components/StatusBadge";
import { COLORS, FONT_SIZE, SPACING } from "../../constants/theme";
import { supabase } from "../../lib/supabase";
import type { OrganizationStatusValue } from "../../types";

const statuses: OrganizationStatusValue[] = ["Open", "Limited", "Full", "Closed"];

type OrganizationStatusRow = {
  id: string;
  status: OrganizationStatusValue;
  note: string | null;
  updated_at: string;
};

export default function UpdateOrganizationStatusScreen() {
  const [currentStatus, setCurrentStatus] = useState<OrganizationStatusRow | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrganizationStatusValue>("Open");
  const [note, setNote] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadOrganizationStatus = async () => {
    setIsLoading(true);
    setErrorMessage("");
    setConfirmation("");

    const { data, error } = await supabase
      .from("organization_status")
      .select("id, status, note, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      setErrorMessage("Could not load organization status from Supabase.");
      setCurrentStatus(null);
    } else if (data) {
      const statusData = data as OrganizationStatusRow;

      setCurrentStatus(statusData);
      setSelectedStatus(statusData.status);
      setNote(statusData.note || "");
    } else {
      setErrorMessage("No organization status record was found in Supabase.");
      setCurrentStatus(null);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadOrganizationStatus();
  }, []);

  const save = async () => {
    setConfirmation("");
    setErrorMessage("");

    if (!currentStatus) {
      setErrorMessage("No organization status record is available to update.");
      return;
    }

    setIsSaving(true);

    const { data, error } = await supabase
      .from("organization_status")
      .update({
        status: selectedStatus,
        note: note.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentStatus.id)
      .select("id, status, note, updated_at")
      .single();

    if (error) {
      setErrorMessage("Organization status could not be saved to Supabase. Please try again.");
      setIsSaving(false);
      return;
    }

    const updatedStatus = data as OrganizationStatusRow;

    setCurrentStatus(updatedStatus);
    setSelectedStatus(updatedStatus.status);
    setNote(updatedStatus.note || "");
    setConfirmation(`Organization status was updated to ${selectedStatus}.`);
    setIsSaving(false);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: "Organization Status" }} />

      <SectionTitle
        title="Set Organization Status"
        subtitle="Choose the status that accurately describes current intake capacity. Changes are saved to Supabase."
      />

      {isLoading ? (
        <Card>
          <Text style={styles.loadingText}>Loading organization status from Supabase...</Text>
        </Card>
      ) : null}

      {errorMessage ? (
        <Card accentColor={COLORS.emergency} style={styles.errorCard}>
          <Text style={styles.errorTitle}>Database error</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <AppButton title="Try Again" onPress={loadOrganizationStatus} variant="danger" />
        </Card>
      ) : null}

      {currentStatus ? (
        <Card accentColor={COLORS.primary}>
          <Text style={styles.currentLabel}>Current published status</Text>

          <View style={styles.currentRow}>
            <StatusBadge label={currentStatus.status} />
            <Text style={styles.currentNote}>{currentStatus.note || "No public note."}</Text>
          </View>
        </Card>
      ) : null}

      <View style={styles.grid}>
        {statuses.map((status) => (
          <View key={status} style={styles.half}>
            <SelectOption
              label={status}
              selected={selectedStatus === status}
              onPress={() => {
                setSelectedStatus(status);
                setConfirmation("");
              }}
            />
          </View>
        ))}
      </View>

      <FormInput
        label="Optional public note"
        placeholder="Example: Only families with children accepted tonight"
        value={note}
        onChangeText={(value) => {
          setNote(value);
          setConfirmation("");
        }}
        multiline
        maxLength={250}
      />

      {confirmation ? (
        <Card accentColor={COLORS.success} style={styles.successCard}>
          <Text style={styles.successText}>{confirmation}</Text>
        </Card>
      ) : null}

      <AppButton
        title={isSaving ? "Saving..." : "Save Status"}
        onPress={save}
        variant="success"
        disabled={isLoading || isSaving || !currentStatus}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
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
    marginVertical: SPACING.sm,
  },
  currentLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.xs,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  currentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  currentNote: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 19,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -SPACING.xs,
    marginBottom: SPACING.md,
  },
  half: {
    width: "50%",
    paddingHorizontal: SPACING.xs,
  },
  successCard: {
    backgroundColor: COLORS.successLight,
  },
  successText: {
    color: COLORS.success,
    fontSize: FONT_SIZE.sm,
    fontWeight: "800",
  },
});