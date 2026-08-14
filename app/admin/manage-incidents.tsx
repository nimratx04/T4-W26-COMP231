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

type IncidentStatus =
  | "Pending Verification"
  | "Verified"
  | "Responding"
  | "Resolved"
  | "Rejected";

type IncidentRow = {
  id: string;
  incident_type: string;
  description: string;
  location: string;
  urgency: string;
  photo_name: string | null;
  status: IncidentStatus;
  created_at: string;
};

const statusOptions: IncidentStatus[] = [
  "Pending Verification",
  "Verified",
  "Responding",
  "Resolved",
  "Rejected",
];

// Validation rules for status transitions
const validTransitions: Record<IncidentStatus, IncidentStatus[]> = {
  "Pending Verification": ["Verified", "Rejected"],
  "Verified": ["Responding", "Rejected"],
  "Responding": ["Resolved", "Rejected"],
  "Resolved": [],
  "Rejected": ["Pending Verification"],
};

const getStatusMessage = (from: IncidentStatus, to: IncidentStatus): string | null => {
  const valid = validTransitions[from] || [];
  if (!valid.includes(to)) {
    return `Cannot transition from "${from}" to "${to}". Allowed transitions: ${valid.join(", ") || "none"}`;
  }
  return null;
};

export default function ManageIncidentsScreen() {
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error">("success");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadIncidents = async () => {
    setIsLoading(true);
    setErrorMessage("");
    setFeedback("");

    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage("Could not load incident reports from Supabase.");
      setIncidents([]);
    } else {
      setIncidents(data || []);
      setExpandedId((current) => current ?? data?.[0]?.id ?? null);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const updateStatus = async (incident: IncidentRow, status: IncidentStatus) => {
    setFeedback("");

    // Validate transition
    const validationMessage = getStatusMessage(incident.status, status);
    if (validationMessage) {
      setFeedbackType("error");
      setFeedback(validationMessage);
      return;
    }

    // Additional validation: Resolve requires description
    if (status === "Resolved" && !incident.description) {
      setFeedbackType("error");
      setFeedback("Cannot resolve: Description is required.");
      return;
    }

    // Escalate validation: Escalating requires note
    if (status === "Responding" && incident.status === "Verified") {
      // In a real app, you'd check for a note or escalation reason
      setFeedbackType("success");
      setFeedback("Incident escalated to Responding. Response team has been notified.");
    }

    const { error } = await supabase
      .from("reports")
      .update({ status })
      .eq("id", incident.id);

    if (error) {
      setFeedbackType("error");
      setFeedback("Status could not be updated. Please try again.");
      return;
    }

    setIncidents((current) =>
      current.map((item) =>
        item.id === incident.id
          ? {
              ...item,
              status,
            }
          : item
      )
    );

    setFeedbackType("success");
    setFeedback(`${incident.incident_type} report was updated to ${status}.`);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: "Manage Incidents" }} />

      <SectionTitle
        title="Manage Incident Reports"
        subtitle="Review incident reports, verify or reject them, and update status with validation."
      />

      {feedback ? (
        <Card
          accentColor={feedbackType === "error" ? COLORS.emergency : COLORS.success}
          style={feedbackType === "error" ? styles.errorCard : styles.feedbackCard}
        >
          <Text style={feedbackType === "error" ? styles.errorText : styles.feedbackText}>
            {feedback}
          </Text>
        </Card>
      ) : null}

      {isLoading ? (
        <Card>
          <Text style={styles.loadingText}>Loading incidents...</Text>
        </Card>
      ) : errorMessage ? (
        <Card accentColor={COLORS.emergency} style={styles.errorCard}>
          <Text style={styles.errorTitle}>Database error</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <AppButton title="Try Again" onPress={loadIncidents} variant="danger" />
        </Card>
      ) : incidents.length === 0 ? (
        <EmptyState
          icon="🚨"
          title="No incident reports"
          message="Community reporters have not submitted any incidents."
        />
      ) : (
        incidents.map((incident) => {
          const expanded = expandedId === incident.id;
          const allowedTransitions = validTransitions[incident.status] || [];

          return (
            <Card
              key={incident.id}
              accentColor={
                incident.urgency === "Urgent"
                  ? COLORS.emergency
                  : incident.status === "Pending Verification"
                  ? COLORS.warning
                  : incident.status === "Resolved"
                  ? COLORS.success
                  : COLORS.primary
              }
            >
              <View style={styles.headerRow}>
                <View style={styles.titleWrap}>
                  <Text style={styles.title}>{incident.incident_type}</Text>
                  <Text style={styles.location}>{incident.location}</Text>
                </View>

                <View style={styles.badges}>
                  <StatusBadge label={incident.urgency} />
                  <StatusBadge label={incident.status} />
                </View>
              </View>

              <AppButton
                title={expanded ? "Hide Details" : "Open Incident Details"}
                onPress={() => setExpandedId(expanded ? null : incident.id)}
                variant="outline"
              />

              {expanded ? (
                <View style={styles.details}>
                  <Detail label="Description" value={incident.description} />
                  {incident.photo_name ? (
                    <Detail label="Photo reference" value={incident.photo_name} />
                  ) : null}

                  <Text style={styles.sectionLabel}>
                    Update status (Allowed: {allowedTransitions.join(", ") || "None"})
                  </Text>
                  <View style={styles.buttonRow}>
                    {statusOptions.map((status) => {
                      const isAllowed = allowedTransitions.includes(status);
                      const isCurrent = incident.status === status;

                      return (
                        <AppButton
                          key={status}
                          title={status}
                          onPress={() => updateStatus(incident, status)}
                          variant={
                            isCurrent
                              ? "primary"
                              : status === "Resolved"
                              ? "success"
                              : isAllowed
                              ? "secondary"
                              : "outline"
                          }
                          style={styles.flex}
                          disabled={!isAllowed && !isCurrent}
                        />
                      );
                    })}
                  </View>

                  {incident.status === "Pending Verification" && (
                    <View style={styles.actionRow}>
                      <AppButton
                        title="Verify"
                        onPress={() => updateStatus(incident, "Verified")}
                        variant="success"
                        style={styles.flex}
                      />
                      <AppButton
                        title="Reject"
                        onPress={() => updateStatus(incident, "Rejected")}
                        variant="danger"
                        style={styles.flex}
                      />
                    </View>
                  )}

                  {incident.status === "Verified" && (
                    <AppButton
                      title="Escalate to Responding"
                      onPress={() => updateStatus(incident, "Responding")}
                      variant="primary"
                    />
                  )}

                  {incident.status === "Responding" && (
                    <AppButton
                      title="Resolve"
                      onPress={() => updateStatus(incident, "Resolved")}
                      variant="success"
                    />
                  )}
                </View>
              ) : null}
            </Card>
          );
        })
      )}

      <AppButton title="Refresh Incidents" onPress={loadIncidents} variant="secondary" />
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
    color: COLORS.success,
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
    color: COLORS.emergency,
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
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
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
  },
  location: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  badges: {
    alignItems: "flex-end",
    gap: SPACING.xs,
  },
  details: {
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
  },
  detailRow: {
    marginBottom: SPACING.md,
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
  sectionLabel: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  flex: {
    flex: 1,
    paddingHorizontal: SPACING.xs,
    minWidth: "30%",
  },
  actionRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
});