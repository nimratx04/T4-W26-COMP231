import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";
import StatusBadge from "../../components/StatusBadge";
import { COLORS, FONT_SIZE, SPACING } from "../../constants/theme";
import { supabase } from "../../lib/supabase";

type VolunteerStatus = "Pending" | "Verified" | "Rejected" | "Expired";

type VolunteerRow = {
  id: string;
  name: string;
  email: string | null;
  id_reference: string | null;
  police_check_reference: string | null;
  emergency_contact: string | null;
  safety_agreement: boolean;
  status: VolunteerStatus;
  result_message: string | null;
  created_at: string;
};

export default function VolunteerApprovalScreen() {
  const [pendingVolunteers, setPendingVolunteers] = useState<VolunteerRow[]>([]);
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadPendingVolunteers = async () => {
    setIsLoading(true);
    setErrorMessage("");
    setFeedback("");

    const { data, error } = await supabase
      .from("volunteers")
      .select(
        "id, name, email, id_reference, police_check_reference, emergency_contact, safety_agreement, status, result_message, created_at"
      )
      .eq("status", "Pending")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage("Could not load pending volunteers from Supabase.");
      setPendingVolunteers([]);
    } else {
      setPendingVolunteers((data || []) as VolunteerRow[]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadPendingVolunteers();
  }, []);

  const approve = async (volunteer: VolunteerRow) => {
    setFeedback("");

    const { error } = await supabase
      .from("volunteers")
      .update({
        status: "Verified",
        result_message: "Volunteer has been approved. Task access is now enabled.",
      })
      .eq("id", volunteer.id);

    if (error) {
      setFeedback(`${volunteer.name} could not be approved. Please try again.`);
      return;
    }

    setPendingVolunteers((current) => current.filter((item) => item.id !== volunteer.id));
    setFeedback(`${volunteer.name} was approved. Task access is now enabled.`);
  };

  const reject = async (volunteer: VolunteerRow) => {
    setFeedback("");

    const { error } = await supabase
      .from("volunteers")
      .update({
        status: "Rejected",
        result_message: "Volunteer verification was rejected by the admin.",
      })
      .eq("id", volunteer.id);

    if (error) {
      setFeedback(`${volunteer.name} could not be rejected. Please try again.`);
      return;
    }

    setPendingVolunteers((current) => current.filter((item) => item.id !== volunteer.id));
    setFeedback(`${volunteer.name} was rejected. The verification result was updated.`);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: "Volunteer Approval" }} />

      <SectionTitle
        title="Review Pending Volunteers"
        subtitle="Pending volunteer applications are loaded from Supabase. Admin can approve or reject each application."
      />

      {feedback ? (
        <Card
          accentColor={feedback.includes("could not") ? COLORS.emergency : COLORS.success}
          style={feedback.includes("could not") ? styles.errorCard : styles.feedbackCard}
        >
          <Text style={styles.feedbackText}>{feedback}</Text>
        </Card>
      ) : null}

      {isLoading ? (
        <Card>
          <Text style={styles.loadingText}>Loading pending volunteers...</Text>
        </Card>
      ) : errorMessage ? (
        <Card accentColor={COLORS.emergency} style={styles.errorCard}>
          <Text style={styles.errorTitle}>Database error</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <AppButton title="Try Again" onPress={loadPendingVolunteers} variant="danger" />
        </Card>
      ) : pendingVolunteers.length === 0 ? (
        <EmptyState
          icon="✅"
          title="No pending volunteers"
          message="All submitted volunteer applications have been reviewed."
        />
      ) : (
        pendingVolunteers.map((volunteer) => (
          <Card key={volunteer.id} accentColor={COLORS.warning}>
            <View style={styles.headerRow}>
              <View style={styles.titleWrap}>
                <Text style={styles.name}>{volunteer.name}</Text>
                <Text style={styles.email}>{volunteer.email || "No email provided"}</Text>
              </View>

              <StatusBadge label={volunteer.status} />
            </View>

            <Detail label="ID document" value={volunteer.id_reference || "Missing"} />
            <Detail label="Police check" value={volunteer.police_check_reference || "Missing"} />
            <Detail label="Emergency contact" value={volunteer.emergency_contact || "Missing"} />
            <Detail label="Safety agreement" value={volunteer.safety_agreement ? "Accepted" : "Not accepted"} />

            <View style={styles.buttonRow}>
              <AppButton
                title="Approve"
                onPress={() => approve(volunteer)}
                variant="success"
                style={styles.flex}
              />
              <AppButton
                title="Reject"
                onPress={() => reject(volunteer)}
                variant="danger"
                style={styles.flex}
              />
            </View>
          </Card>
        ))
      )}

      <Card accentColor={COLORS.primary} style={styles.demoCard}>
        <Text style={styles.demoTitle}>End-to-end demo</Text>
        <Text style={styles.demoText}>
          Submit a volunteer verification form, approve it here, then open Verification Status to confirm task access.
        </Text>
      </Card>

      <AppButton title="Refresh Pending Volunteers" onPress={loadPendingVolunteers} variant="secondary" />
    </Screen>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  feedbackCard: {
    backgroundColor: COLORS.successLight,
  },
  feedbackText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: "800",
  },
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
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  titleWrap: {
    flex: 1,
  },
  name: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
  },
  email: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  detailRow: {
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    paddingTop: SPACING.md,
    marginTop: SPACING.md,
  },
  detailLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.xs,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  detailValue: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    marginTop: SPACING.xs,
  },
  buttonRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  flex: {
    flex: 1,
  },
  demoCard: {
    backgroundColor: COLORS.primaryLight,
    marginTop: SPACING.md,
  },
  demoTitle: {
    color: COLORS.primaryDark,
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
  },
  demoText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
    marginTop: SPACING.xs,
  },
});