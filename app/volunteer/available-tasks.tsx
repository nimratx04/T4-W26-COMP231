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

const priorityRank: Record<Priority, number> = {
  Urgent: 1,
  High: 2,
  Medium: 3,
  Low: 4,
};

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

export default function AvailableTasksScreen() {
  const router = useRouter();

  const [currentVolunteer, setCurrentVolunteer] = useState<VolunteerRow | null>(null);
  const [availableRequests, setAvailableRequests] = useState<HelpRequestRow[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage("");
    setMessage("");

    const [volunteerResult, requestsResult] = await Promise.all([
      supabase
        .from("volunteers")
        .select("id, name, status")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),

      supabase
        .from("help_requests")
        .select(
          "id, help_type, location, description, priority, status, assigned_volunteer_id, created_at",
        )
        .eq("status", "Pending")
        .is("assigned_volunteer_id", null)
        .order("created_at", { ascending: false }),
    ]);

    if (volunteerResult.error) {
      setCurrentVolunteer(null);
    } else {
      setCurrentVolunteer(volunteerResult.data as VolunteerRow | null);
    }

    if (requestsResult.error) {
      setAvailableRequests([]);
      setErrorMessage("Could not load available help requests from Supabase.");
    } else {
      setAvailableRequests((requestsResult.data || []) as HelpRequestRow[]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const verified = currentVolunteer?.status === "Verified";

  const sortedRequests = useMemo(
    () =>
      [...availableRequests].sort((a, b) => {
        const aPriority = a.priority || "Low";
        const bPriority = b.priority || "Low";

        const priorityDifference =
          priorityRank[aPriority as Priority] - priorityRank[bPriority as Priority];

        if (priorityDifference !== 0) return priorityDifference;

        return (
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
      }),
    [availableRequests],
  );

  const urgentCount = availableRequests.filter(
    (request) => request.priority === "Urgent",
  ).length;

  const incompleteTaskCount = availableRequests.filter(
    (request) => getMissingTaskFields(request).length > 0,
  ).length;

  const completeTaskCount = availableRequests.length - incompleteTaskCount;

  const acceptRequest = async (request: HelpRequestRow) => {
    setMessage("");

    if (!currentVolunteer || currentVolunteer.status !== "Verified") {
      setMessage("Only a Verified volunteer can accept available tasks.");
      return;
    }

    const missingFields = getMissingTaskFields(request);

    if (missingFields.length > 0) {
      setMessage(
        `This task is missing ${missingFields.join(
          ", ",
        )}. Ask Admin to complete the task details before accepting it.`,
      );
      return;
    }

    const { error } = await supabase
      .from("help_requests")
      .update({
        assigned_volunteer_id: currentVolunteer.id,
        status: "Active",
      })
      .eq("id", request.id)
      .eq("status", "Pending")
      .is("assigned_volunteer_id", null);

    if (error) {
      setMessage("This task could not be accepted. It may already be assigned.");
      return;
    }

    setAvailableRequests((current) => current.filter((item) => item.id !== request.id));
    setMessage(
      `${getTaskTitle(request)} was accepted. It is now Active and assigned to ${
        currentVolunteer.name || "you"
      }.`,
    );
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: "Available Tasks" }} />

      <SectionTitle
        title="Available Nearby Tasks"
        subtitle="Every unassigned pending help request appears here for verified volunteers. Accepting one updates Admin data automatically."
      />

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{availableRequests.length}</Text>
          <Text style={styles.summaryLabel}>Available</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{completeTaskCount}</Text>
          <Text style={styles.summaryLabel}>Complete details</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={[styles.summaryNumber, styles.warningNumber]}>
            {incompleteTaskCount}
          </Text>
          <Text style={styles.summaryLabel}>Need review</Text>
        </Card>
      </View>

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={[styles.summaryNumber, styles.urgentNumber]}>{urgentCount}</Text>
          <Text style={styles.summaryLabel}>Urgent</Text>
        </Card>
      </View>

      {!isLoading && !verified ? (
        <Card accentColor={COLORS.emergency} style={styles.lockCard}>
          <Text style={styles.lockTitle}>Task access locked</Text>
          <Text style={styles.lockText}>
            {currentVolunteer
              ? `${currentVolunteer.name || "This volunteer"} is currently ${
                  currentVolunteer.status || "Pending"
                }. Only Verified volunteers can accept tasks.`
              : "No volunteer verification record was found. Submit verification first."}
          </Text>

          <AppButton
            title="View Verification Status"
            onPress={() => router.push("/volunteer/verification-status" as any)}
            variant="danger"
          />
        </Card>
      ) : null}

      {message ? (
        <Card
          accentColor={
            message.includes("accepted")
              ? COLORS.success
              : message.includes("missing")
                ? COLORS.warning
                : COLORS.emergency
          }
        >
          <Text style={styles.message}>{message}</Text>

          {message.includes("accepted") ? (
            <AppButton
              title="Open My Tasks"
              onPress={() => router.push("/volunteer/my-tasks" as any)}
              variant="success"
            />
          ) : null}
        </Card>
      ) : null}

      {isLoading ? (
        <Card>
          <Text style={styles.loadingText}>Loading available tasks...</Text>
        </Card>
      ) : errorMessage ? (
        <Card accentColor={COLORS.emergency} style={styles.errorCard}>
          <Text style={styles.errorTitle}>Database error</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <AppButton title="Try Again" onPress={loadData} variant="danger" />
        </Card>
      ) : sortedRequests.length === 0 ? (
        <EmptyState
          icon="📌"
          title="No available tasks"
          message="Pending unassigned help requests from affected users will appear here."
          actionTitle="Refresh Tasks"
          onAction={loadData}
        />
      ) : (
        sortedRequests.map((request) => {
          const missingFields = getMissingTaskFields(request);
          const taskIsComplete = missingFields.length === 0;

          return (
            <Card
              key={request.id}
              accentColor={
                !taskIsComplete
                  ? COLORS.warning
                  : request.priority === "Urgent"
                    ? COLORS.emergency
                    : COLORS.primary
              }
            >
              <View style={styles.headerRow}>
                <View style={styles.titleWrap}>
                  <Text style={styles.title}>{getTaskTitle(request)}</Text>
                  <Text style={styles.meta}>{formatDateTime(request.created_at)}</Text>
                </View>

                <View style={styles.badges}>
                  <StatusBadge label={getDisplayValue(request.priority, "Missing")} />
                  <StatusBadge label={taskIsComplete ? "Complete" : "Incomplete"} />
                  <StatusBadge label="Available" />
                </View>
              </View>

              {!taskIsComplete ? (
                <Card accentColor={COLORS.warning} style={styles.validationCard}>
                  <Text style={styles.validationTitle}>Missing task details</Text>
                  <Text style={styles.validationText}>
                    Required field(s): {missingFields.join(", ")}. This task is visible
                    to volunteers but cannot be accepted until Admin completes the details.
                  </Text>
                </Card>
              ) : null}

              <Text style={styles.label}>Task type</Text>
              <Text style={styles.value}>
                {getDisplayValue(request.help_type, "Task type missing")}
              </Text>

              <Text style={styles.label}>Nearby / General location</Text>
              <Text style={styles.value}>
                {getDisplayValue(request.location, "Location missing")}
              </Text>

              <Text style={styles.label}>Priority / Urgency</Text>
              <Text style={styles.value}>
                {getDisplayValue(request.priority, "Priority missing")}
              </Text>

              <Text style={styles.label}>Need description</Text>
              <Text style={styles.description}>
                {getDisplayValue(request.description, "Description missing")}
              </Text>

              <AppButton
                title={taskIsComplete ? "Accept This Task" : "Cannot Accept Yet"}
                onPress={() => acceptRequest(request)}
                variant={taskIsComplete ? "success" : "outline"}
                disabled={!verified || !taskIsComplete}
                style={styles.acceptButton}
              />
            </Card>
          );
        })
      )}

      <AppButton title="Refresh Tasks" onPress={loadData} variant="secondary" />
    </Screen>
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
  urgentNumber: {
    color: COLORS.emergency,
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
  lockCard: {
    backgroundColor: COLORS.emergencyLight,
  },
  lockTitle: {
    color: COLORS.emergencyDark,
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
  },
  lockText: {
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
    marginBottom: SPACING.sm,
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
  meta: {
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
    marginBottom: 0,
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
  description: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    marginTop: SPACING.xs,
  },
  acceptButton: {
    marginTop: SPACING.md,
  },
});