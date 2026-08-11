import { Stack } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
  help_type: HelpType | null;
  location: string | null;
  description: string | null;
  priority: Priority | null;
  status: HelpRequestStatus | null;
  assigned_volunteer_id: string | null;
  created_at: string | null;
};

type VolunteerRow = {
  id: string;
  name: string | null;
  email: string | null;
  status: string | null;
};

const hasText = (value: string | null | undefined) => Boolean(value?.trim());

const getDisplayValue = (value: string | null | undefined, fallback: string) =>
  value?.trim() ? value.trim() : fallback;

const getTaskTitle = (request: HelpRequestRow) =>
  request.help_type ? `${request.help_type} Request` : "Untitled Request";

const getMissingTaskFields = (request: HelpRequestRow) => {
  const missingFields: string[] = [];

  if (!hasText(request.help_type)) {
    missingFields.push("task type");
  }

  if (!hasText(request.location)) {
    missingFields.push("location");
  }

  if (!hasText(request.priority)) {
    missingFields.push("priority/urgency");
  }

  if (!hasText(request.description)) {
    missingFields.push("description");
  }

  return missingFields;
};

const formatDateTime = (value: string | null) => {
  if (!value) return "Date unavailable";

  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
        .select(
          "id, help_type, location, description, priority, status, assigned_volunteer_id, created_at",
        )
        .order("created_at", { ascending: false }),

      supabase
        .from("volunteers")
        .select("id, name, email, status")
        .eq("status", "Verified")
        .order("created_at", { ascending: false }),
    ]);

    if (requestsResult.error) {
      setHelpRequests([]);
      setErrorMessage(`Could not load help requests: ${requestsResult.error.message}`);
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

  const availableCount = useMemo(
    () =>
      helpRequests.filter(
        (request) => request.status === "Pending" && !request.assigned_volunteer_id,
      ).length,
    [helpRequests],
  );

  const assignedCount = useMemo(
    () => helpRequests.filter((request) => Boolean(request.assigned_volunteer_id)).length,
    [helpRequests],
  );

  const resolvedCount = useMemo(
    () => helpRequests.filter((request) => request.status === "Resolved").length,
    [helpRequests],
  );

  const incompleteCount = useMemo(
    () =>
      helpRequests.filter((request) => getMissingTaskFields(request).length > 0).length,
    [helpRequests],
  );

  const getVolunteerName = (volunteerId: string | null) => {
    if (!volunteerId) return "None assigned";

    const volunteer = verifiedVolunteers.find((item) => item.id === volunteerId);
    return volunteer?.name || "Volunteer assigned";
  };

  const updateLocalRequest = (requestId: string, changes: Partial<HelpRequestRow>) => {
    setHelpRequests((current) =>
      current.map((item) =>
        item.id === requestId
          ? {
              ...item,
              ...changes,
            }
          : item,
      ),
    );
  };

  const updateStatus = async (request: HelpRequestRow, status: HelpRequestStatus) => {
    setFeedback("");

    if (status === "Active" && !request.assigned_volunteer_id) {
      setFeedback(
        "Assign a verified volunteer first before changing this request to Active.",
      );
      return;
    }

    const changes =
      status === "Pending"
        ? {
            status,
            assigned_volunteer_id: null,
          }
        : {
            status,
          };

    const { error } = await supabase
      .from("help_requests")
      .update(changes)
      .eq("id", request.id);

    if (error) {
      setFeedback(`Status could not be updated: ${error.message}`);
      return;
    }

    updateLocalRequest(request.id, changes);
    setFeedback(
      status === "Pending"
        ? `${getTaskTitle(request)} is now Pending and unassigned. It will appear in Volunteer Available Tasks.`
        : `${getTaskTitle(request)} was updated to ${status}.`,
    );
  };

  const assignVolunteer = async (request: HelpRequestRow, volunteerId: string) => {
    setFeedback("");

    const missingFields = getMissingTaskFields(request);

    if (missingFields.length > 0) {
      setFeedback(
        `This request is missing ${missingFields.join(
          ", ",
        )}. Complete these details before assigning a volunteer.`,
      );
      return;
    }

    const volunteer = verifiedVolunteers.find((item) => item.id === volunteerId);

    const { error } = await supabase
      .from("help_requests")
      .update({
        assigned_volunteer_id: volunteerId,
        status: "Active",
      })
      .eq("id", request.id);

    if (error) {
      setFeedback(`Volunteer could not be assigned: ${error.message}`);
      return;
    }

    updateLocalRequest(request.id, {
      assigned_volunteer_id: volunteerId,
      status: "Active",
    });

    setFeedback(
      `${volunteer?.name || "Volunteer"} was assigned to ${getTaskTitle(
        request,
      ).toLowerCase()}. The request is now Active and will appear in that volunteer’s My Tasks.`,
    );
  };

  const makeAvailableAgain = async (request: HelpRequestRow) => {
    setFeedback("");

    const { error } = await supabase
      .from("help_requests")
      .update({
        assigned_volunteer_id: null,
        status: "Pending",
      })
      .eq("id", request.id);

    if (error) {
      setFeedback(`Request could not be made available again: ${error.message}`);
      return;
    }

    updateLocalRequest(request.id, {
      assigned_volunteer_id: null,
      status: "Pending",
    });

    setFeedback(
      `${getTaskTitle(
        request,
      )} is now Pending and unassigned. Every verified volunteer can see it in Available Tasks.`,
    );
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: "Manage Help Requests" }} />

      <SectionTitle
        title="Manage Help Requests"
        subtitle="Assign verified volunteers manually or keep pending requests available for volunteers to accept."
      />

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{availableCount}</Text>
          <Text style={styles.summaryLabel}>Available</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{assignedCount}</Text>
          <Text style={styles.summaryLabel}>Assigned</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{resolvedCount}</Text>
          <Text style={styles.summaryLabel}>Resolved</Text>
        </Card>
      </View>

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={[styles.summaryNumber, styles.warningNumber]}>
            {incompleteCount}
          </Text>
          <Text style={styles.summaryLabel}>Need review</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{verifiedVolunteers.length}</Text>
          <Text style={styles.summaryLabel}>Verified volunteers</Text>
        </Card>
      </View>

      {feedback ? (
        <Card
          accentColor={
            feedback.includes("could not") ||
            feedback.includes("missing") ||
            feedback.includes("Assign a verified")
              ? COLORS.warning
              : COLORS.success
          }
          style={styles.feedbackCard}
        >
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
          message="New requests submitted by affected individuals will appear here."
          actionTitle="Refresh Requests"
          onAction={loadData}
        />
      ) : (
        helpRequests.map((request) => {
          const expanded = expandedId === request.id;
          const missingFields = getMissingTaskFields(request);
          const requestIsComplete = missingFields.length === 0;
          const isAvailableToVolunteers =
            request.status === "Pending" && !request.assigned_volunteer_id;

          return (
            <Card
              key={request.id}
              accentColor={
                !requestIsComplete
                  ? COLORS.warning
                  : request.status === "Resolved"
                    ? COLORS.success
                    : request.priority === "Urgent"
                      ? COLORS.emergency
                      : COLORS.primary
              }
            >
              <View style={styles.headerRow}>
                <View style={styles.titleWrap}>
                  <Text style={styles.title}>{getTaskTitle(request)}</Text>
                  <Text style={styles.location}>
                    {getDisplayValue(request.location, "Location missing")}
                  </Text>
                  <Text style={styles.createdAt}>
                    Submitted {formatDateTime(request.created_at)}
                  </Text>
                </View>

                <View style={styles.badges}>
                  <StatusBadge label={getDisplayValue(request.priority, "Missing")} />
                  <StatusBadge label={getDisplayValue(request.status, "Missing")} />
                  <StatusBadge label={requestIsComplete ? "Complete" : "Incomplete"} />
                  {isAvailableToVolunteers ? <StatusBadge label="Available" /> : null}
                </View>
              </View>

              {!requestIsComplete ? (
                <Card accentColor={COLORS.warning} style={styles.validationCard}>
                  <Text style={styles.validationTitle}>Missing request details</Text>
                  <Text style={styles.validationText}>
                    Required field(s): {missingFields.join(", ")}. This request should
                    be completed before a volunteer accepts or Admin assigns it.
                  </Text>
                </Card>
              ) : null}

              <AppButton
                title={expanded ? "Hide Details" : "Open Request Details"}
                onPress={() => setExpandedId(expanded ? null : request.id)}
                variant="outline"
              />

              {expanded ? (
                <View style={styles.details}>
                  <Detail
                    label="Task type"
                    value={getDisplayValue(request.help_type, "Task type missing")}
                  />

                  <Detail
                    label="Description"
                    value={getDisplayValue(request.description, "Description missing")}
                  />

                  <Detail
                    label="Assigned volunteer"
                    value={getVolunteerName(request.assigned_volunteer_id)}
                  />

                  <Card accentColor={COLORS.info} style={styles.infoCard}>
                    <Text style={styles.infoTitle}>Volunteer availability rule</Text>
                    <Text style={styles.infoText}>
                      This request appears on every verified volunteer’s Available Tasks
                      page only when it is Pending and has no assigned volunteer.
                    </Text>
                  </Card>

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

                  <Text style={styles.sectionLabel}>
                    Manually assign verified volunteer
                  </Text>

                  {verifiedVolunteers.length === 0 ? (
                    <Text style={styles.noVolunteer}>
                      No verified volunteers are currently available.
                    </Text>
                  ) : (
                    verifiedVolunteers.map((volunteer) => (
                      <SelectOption
                        key={volunteer.id}
                        label={volunteer.name || "Unnamed volunteer"}
                        description={volunteer.email || "No email provided"}
                        selected={request.assigned_volunteer_id === volunteer.id}
                        onPress={() => assignVolunteer(request, volunteer.id)}
                      />
                    ))
                  )}

                  <AppButton
                    title="Make Available Again"
                    onPress={() => makeAvailableAgain(request)}
                    variant="secondary"
                    disabled={isAvailableToVolunteers}
                  />

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
  summaryRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  summaryCard: {
    flex: 1,
    alignItems: "center",
    padding: SPACING.md,
  },
  summaryNumber: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.xl,
    fontWeight: "900",
  },
  warningNumber: {
    color: COLORS.warning,
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    textAlign: "center",
    marginTop: 2,
  },
  feedbackCard: {
    backgroundColor: COLORS.successLight,
  },
  feedbackText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: "800",
    lineHeight: 20,
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
  createdAt: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  badges: {
    alignItems: "flex-end",
    gap: SPACING.xs,
  },
  validationCard: {
    backgroundColor: COLORS.warningLight,
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
  },
  validationTitle: {
    color: COLORS.warning,
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
  },
  validationText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    marginTop: SPACING.xs,
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
  infoCard: {
    backgroundColor: COLORS.infoLight,
    marginBottom: SPACING.md,
  },
  infoTitle: {
    color: COLORS.info,
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
  },
  infoText: {
    color: COLORS.textSecondary,
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