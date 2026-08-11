import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";
import StatusBadge from "../../components/StatusBadge";
import { COLORS, FONT_SIZE, SPACING } from "../../constants/theme";
import { supabase } from "../../lib/supabase";
import type { HelpRequestStatus, HelpType, Priority } from "../../types";

type VolunteerRow = {
  id: string;
  name: string | null;
  status: string | null;
};

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

const sections: HelpRequestStatus[] = ["Active", "Resolved"];

const hasText = (value: string | null | undefined) => Boolean(value?.trim());

const getDisplayValue = (value: string | null | undefined, fallback: string) =>
  value?.trim() ? value.trim() : fallback;

const getTaskTitle = (request: HelpRequestRow) =>
  request.help_type ? `${request.help_type} Support` : "Untitled task";

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

export default function MyTasksScreen() {
  const router = useRouter();

  const [currentVolunteer, setCurrentVolunteer] = useState<VolunteerRow | null>(null);
  const [myRequests, setMyRequests] = useState<HelpRequestRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadMyTasks = async () => {
    setIsLoading(true);
    setMessage("");
    setErrorMessage("");

    const { data: volunteerData, error: volunteerError } = await supabase
      .from("volunteers")
      .select("id, name, status")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (volunteerError) {
      setCurrentVolunteer(null);
      setMyRequests([]);
      setErrorMessage(`Could not load volunteer information: ${volunteerError.message}`);
      setIsLoading(false);
      return;
    }

    const volunteer = volunteerData as VolunteerRow | null;
    setCurrentVolunteer(volunteer);

    if (!volunteer) {
      setMyRequests([]);
      setIsLoading(false);
      return;
    }

    const { data: requestData, error: requestError } = await supabase
      .from("help_requests")
      .select(
        "id, help_type, location, description, priority, status, assigned_volunteer_id, created_at",
      )
      .eq("assigned_volunteer_id", volunteer.id)
      .in("status", sections)
      .order("created_at", { ascending: false });

    if (requestError) {
      setMyRequests([]);
      setErrorMessage(`Could not load your assigned tasks: ${requestError.message}`);
    } else {
      setMyRequests((requestData || []) as HelpRequestRow[]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadMyTasks();
  }, []);

  const activeCount = useMemo(
    () => myRequests.filter((request) => request.status === "Active").length,
    [myRequests],
  );

  const resolvedCount = useMemo(
    () => myRequests.filter((request) => request.status === "Resolved").length,
    [myRequests],
  );

  const incompleteCount = useMemo(
    () => myRequests.filter((request) => getMissingTaskFields(request).length > 0).length,
    [myRequests],
  );

  const updateRequestStatus = async (request: HelpRequestRow, status: HelpRequestStatus) => {
    setMessage("");

    const missingFields = getMissingTaskFields(request);

    if (status === "Resolved" && missingFields.length > 0) {
      setMessage(
        `This task is missing ${missingFields.join(
          ", ",
        )}. Ask Admin to complete the task details before resolving it.`,
      );
      return;
    }

    const { error } = await supabase
      .from("help_requests")
      .update({ status })
      .eq("id", request.id);

    if (error) {
      setMessage(`Task status could not be updated: ${error.message}`);
      return;
    }

    setMyRequests((current) =>
      current.map((item) =>
        item.id === request.id
          ? {
              ...item,
              status,
            }
          : item,
      ),
    );

    setMessage(`${getTaskTitle(request)} was updated to ${status}. Admin can now see the same status.`);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: "My Tasks" }} />

      <SectionTitle
        title="My Assigned Tasks"
        subtitle="Tasks accepted by you or manually assigned by Admin appear here from the shared help request data."
      />

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{activeCount}</Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{resolvedCount}</Text>
          <Text style={styles.summaryLabel}>Resolved</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={[styles.summaryNumber, styles.warningNumber]}>
            {incompleteCount}
          </Text>
          <Text style={styles.summaryLabel}>Need review</Text>
        </Card>
      </View>

      {isLoading ? (
        <Card>
          <Text style={styles.loadingText}>Loading your tasks...</Text>
        </Card>
      ) : errorMessage ? (
        <Card accentColor={COLORS.emergency} style={styles.errorCard}>
          <Text style={styles.errorTitle}>Database error</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <AppButton title="Try Again" onPress={loadMyTasks} variant="danger" />
        </Card>
      ) : null}

      {!isLoading && !currentVolunteer ? (
        <Card accentColor={COLORS.warning} style={styles.warningCard}>
          <Text style={styles.warningTitle}>No volunteer profile found</Text>
          <Text style={styles.warningText}>
            Submit volunteer verification first. After approval and assignment, your tasks will appear here.
          </Text>

          <AppButton
            title="Submit Verification"
            onPress={() => router.push("/volunteer/verification-form" as any)}
            variant="secondary"
          />
        </Card>
      ) : null}

      {message ? (
        <Card
          accentColor={
            message.includes("could not") || message.includes("missing")
              ? COLORS.warning
              : COLORS.success
          }
        >
          <Text style={styles.message}>{message}</Text>
        </Card>
      ) : null}

      {!isLoading && !errorMessage && currentVolunteer && myRequests.length === 0 ? (
        <EmptyState
          icon="🧰"
          title="No assigned tasks"
          message="Accept an available task or ask Admin to manually assign one."
          actionTitle="View Available Tasks"
          onAction={() => router.push("/volunteer/available-tasks" as any)}
        />
      ) : (
        sections.map((section) => {
          const items = myRequests.filter((request) => request.status === section);

          return (
            <View key={section} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section}</Text>
                <StatusBadge label={String(items.length)} />
              </View>

              {items.length === 0 ? (
                <Text style={styles.emptySection}>No {section.toLowerCase()} tasks.</Text>
              ) : (
                items.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    updateRequestStatus={updateRequestStatus}
                  />
                ))
              )}
            </View>
          );
        })
      )}

      <AppButton title="Refresh My Tasks" onPress={loadMyTasks} variant="secondary" />
    </Screen>
  );
}

function RequestCard({
  request,
  updateRequestStatus,
}: {
  request: HelpRequestRow;
  updateRequestStatus: (request: HelpRequestRow, status: HelpRequestStatus) => void;
}) {
  const missingFields = getMissingTaskFields(request);
  const taskIsComplete = missingFields.length === 0;

  return (
    <Card
      accentColor={
        !taskIsComplete
          ? COLORS.warning
          : request.status === "Resolved"
            ? COLORS.success
            : request.priority === "Urgent"
              ? COLORS.emergency
              : COLORS.primary
      }
    >
      <View style={styles.taskHeader}>
        <View style={styles.taskTitleWrap}>
          <Text style={styles.taskTitle}>{getTaskTitle(request)}</Text>
          <Text style={styles.taskLocation}>
            {getDisplayValue(request.location, "Location missing")}
          </Text>
          <Text style={styles.createdAt}>Assigned from {formatDateTime(request.created_at)}</Text>
        </View>

        <View style={styles.badges}>
          <StatusBadge label={getDisplayValue(request.priority, "Missing")} />
          <StatusBadge label={getDisplayValue(request.status, "Missing")} />
          <StatusBadge label={taskIsComplete ? "Complete" : "Incomplete"} />
        </View>
      </View>

      {!taskIsComplete ? (
        <Card accentColor={COLORS.warning} style={styles.validationCard}>
          <Text style={styles.validationTitle}>Missing task details</Text>
          <Text style={styles.validationText}>
            Required field(s): {missingFields.join(", ")}. Ask Admin to complete this task before resolving it.
          </Text>
        </Card>
      ) : null}

      <Text style={styles.label}>Task type</Text>
      <Text style={styles.value}>
        {getDisplayValue(request.help_type, "Task type missing")}
      </Text>

      <Text style={styles.label}>Need description</Text>
      <Text style={styles.taskDescription}>
        {getDisplayValue(request.description, "Description missing")}
      </Text>

      {request.status === "Active" ? (
        <AppButton
          title={taskIsComplete ? "Mark Resolved" : "Cannot Resolve Yet"}
          onPress={() => updateRequestStatus(request, "Resolved")}
          variant={taskIsComplete ? "success" : "outline"}
          disabled={!taskIsComplete}
        />
      ) : (
        <Text style={styles.completedText}>
          This task is resolved and retained for progress history.
        </Text>
      )}
    </Card>
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
  warningCard: {
    backgroundColor: COLORS.warningLight,
  },
  warningTitle: {
    color: COLORS.warning,
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
  },
  warningText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    marginVertical: SPACING.sm,
  },
  message: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    lineHeight: 20,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
  },
  emptySection: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.md,
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  taskTitleWrap: {
    flex: 1,
  },
  taskTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
  },
  taskLocation: {
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
  label: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.xs,
    fontWeight: "800",
    textTransform: "uppercase",
    marginTop: SPACING.md,
  },
  value: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    marginTop: 3,
  },
  taskDescription: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    marginVertical: SPACING.md,
  },
  completedText: {
    color: COLORS.success,
    fontSize: FONT_SIZE.sm,
    fontWeight: "800",
    marginTop: SPACING.sm,
  },
});