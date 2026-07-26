import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";
import SelectOption from "../../components/SelectOption";
import StatusBadge from "../../components/StatusBadge";
import { COLORS, FONT_SIZE, SPACING } from "../../constants/theme";
import { supabase } from "../../lib/supabase";
import type { HelpRequestStatus, HelpType, Priority } from "../../types";

const requestStatuses: HelpRequestStatus[] = ["Pending", "Active", "Resolved"];

type HelpRequestRow = {
  id: string;
  help_type: HelpType;
  location: string;
  description: string;
  priority: Priority;
  status: HelpRequestStatus;
  assigned_volunteer_id: string | null;
  created_at: string;
};

type VolunteerRow = {
  id: string;
  name: string;
  email: string | null;
  status: string;
};

export default function ManageHelpRequestsScreen() {
  const [helpRequests, setHelpRequests] = useState<HelpRequestRow[]>([]);
  const [verifiedVolunteers, setVerifiedVolunteers] = useState<VolunteerRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage("");
    setFeedback("");

    const [requestsResult, volunteersResult] = await Promise.all([
      supabase
        .from("help_requests")
        .select("id, help_type, location, description, priority, status, assigned_volunteer_id, created_at")
        .order("created_at", { ascending: false }),

      supabase
        .from("volunteers")
        .select("id, name, email, status")
        .eq("status", "Verified")
        .order("created_at", { ascending: false }),
    ]);

    if (requestsResult.error) {
      setErrorMessage("Could not load help requests from Supabase.");
      setHelpRequests([]);
    } else {
      const requests = (requestsResult.data || []) as HelpRequestRow[];
      setHelpRequests(requests);
      setExpandedId((current) => current ?? requests[0]?.id ?? null);
    }

    if (volunteersResult.error) {
      setVerifiedVolunteers([]);
    } else {
      setVerifiedVolunteers((volunteersResult.data || []) as VolunteerRow[]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const getVolunteerName = (volunteerId: string | null) => {
    if (!volunteerId) return "None assigned";

    const volunteer = verifiedVolunteers.find((item) => item.id === volunteerId);
    return volunteer?.name ?? "Volunteer assigned";
  };

  const updateStatus = async (request: HelpRequestRow, status: HelpRequestStatus) => {
    setFeedback("");

    const { error } = await supabase
      .from("help_requests")
      .update({ status })
      .eq("id", request.id);

    if (error) {
      setFeedback("Status could not be updated. Please try again.");
      return;
    }

    setHelpRequests((current) =>
      current.map((item) =>
        item.id === request.id
          ? {
              ...item,
              status,
            }
          : item
      )
    );

    setFeedback(`${request.help_type} request was updated to ${status}.`);
  };

  const assign = async (request: HelpRequestRow, volunteerId: string) => {
    setFeedback("");

    const volunteer = verifiedVolunteers.find((item) => item.id === volunteerId);

    const { error } = await supabase
      .from("help_requests")
      .update({
        assigned_volunteer_id: volunteerId,
        status: "Active",
      })
      .eq("id", request.id);

    if (error) {
      setFeedback("Volunteer could not be assigned. Please try again.");
      return;
    }

    setHelpRequests((current) =>
      current.map((item) =>
        item.id === request.id
          ? {
              ...item,
              assigned_volunteer_id: volunteerId,
              status: "Active",
            }
          : item
      )
    );

    setFeedback(`${volunteer?.name ?? "Volunteer"} was assigned to the ${request.help_type.toLowerCase()} request.`);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: "Manage Help Requests" }} />

      <SectionTitle
        title="Manage Help Requests"
        subtitle="Requests are loaded from Supabase. Admin can update status, assign a verified volunteer, or resolve a request."
      />

      {feedback ? (
        <Card accentColor={feedback.includes("could not") ? COLORS.emergency : COLORS.success} style={styles.feedbackCard}>
          <Text style={styles.feedbackText}>{feedback}</Text>
        </Card>
      ) : null}

      {isLoading ? (
        <Card>
          <Text style={styles.loadingText}>Loading help requests...</Text>
        </Card>
      ) : errorMessage ? (
        <Card accentColor={COLORS.emergency} style={styles.errorCard}>
          <Text style={styles.errorTitle}>Database error</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <AppButton title="Try Again" onPress={loadData} variant="danger" />
        </Card>
      ) : helpRequests.length === 0 ? (
        <EmptyState
          icon="🆘"
          title="No help requests"
          message="New requests submitted by affected individuals will appear here from Supabase."
        />
      ) : (
        helpRequests.map((request) => {
          const expanded = expandedId === request.id;

          return (
            <Card
              key={request.id}
              accentColor={request.priority === "Urgent" ? COLORS.emergency : COLORS.primary}
            >
              <View style={styles.headerRow}>
                <View style={styles.titleWrap}>
                  <Text style={styles.title}>{request.help_type} Request</Text>
                  <Text style={styles.location}>{request.location}</Text>
                </View>

                <View style={styles.badges}>
                  <StatusBadge label={request.priority} />
                  <StatusBadge label={request.status} />
                </View>
              </View>

              <AppButton
                title={expanded ? "Hide Details" : "Open Request Details"}
                onPress={() => setExpandedId(expanded ? null : request.id)}
                variant="outline"
              />

              {expanded ? (
                <View style={styles.details}>
                  <Detail label="Description" value={request.description} />
                  <Detail label="Assigned volunteer" value={getVolunteerName(request.assigned_volunteer_id)} />

                  <Text style={styles.sectionLabel}>Update request status</Text>
                  <View style={styles.buttonRow}>
                    {requestStatuses.map((status) => (
                      <AppButton
                        key={status}
                        title={status}
                        onPress={() => updateStatus(request, status)}
                        variant={
                          status === "Resolved"
                            ? "success"
                            : request.status === status
                              ? "primary"
                              : "outline"
                        }
                        style={styles.flex}
                      />
                    ))}
                  </View>

                  <Text style={styles.sectionLabel}>Assign verified volunteer</Text>
                  {verifiedVolunteers.length === 0 ? (
                    <Text style={styles.noVolunteer}>No verified volunteers are currently available.</Text>
                  ) : (
                    verifiedVolunteers.map((volunteer) => (
                      <SelectOption
                        key={volunteer.id}
                        label={volunteer.name}
                        description={volunteer.email ?? "No email provided"}
                        selected={request.assigned_volunteer_id === volunteer.id}
                        onPress={() => assign(request, volunteer.id)}
                      />
                    ))
                  )}

                  <AppButton
                    title="Resolve Request"
                    onPress={() => updateStatus(request, "Resolved")}
                    variant="success"
                    disabled={request.status === "Resolved"}
                  />
                </View>
              ) : null}
            </Card>
          );
        })
      )}

      <AppButton title="Refresh Requests" onPress={loadData} variant="secondary" />
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
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
  },
  location: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    lineHeight: 17,
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
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  flex: {
    flex: 1,
    paddingHorizontal: SPACING.xs,
  },
  noVolunteer: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.md,
  },
});