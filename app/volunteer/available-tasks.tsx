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

type VolunteerRow = {
  id: string;
  name: string | null;
  status: string | null;
};

type TaskRow = {
  id: string;
  title: string | null;
  type: string | null;
  location: string | null;
  urgency: string | null;
  priority: string | null;
  description: string | null;
  status: string | null;
  assigned_volunteer_id: string | null;
  created_at: string | null;
};

const requiredTaskFields: Array<keyof Pick<
  TaskRow,
  "title" | "type" | "location" | "urgency" | "priority" | "description"
>> = ["title", "type", "location", "urgency", "priority", "description"];

const fieldLabels: Record<string, string> = {
  title: "title",
  type: "task type",
  location: "general location",
  urgency: "urgency",
  priority: "priority",
  description: "description",
};

const hasText = (value: string | null | undefined) => Boolean(value?.trim());

const getMissingTaskFields = (task: TaskRow) =>
  requiredTaskFields
    .filter((field) => !hasText(task[field]))
    .map((field) => fieldLabels[field]);

const getDisplayValue = (value: string | null | undefined, fallback: string) =>
  value?.trim() ? value.trim() : fallback;

export default function AvailableTasksScreen() {
  const router = useRouter();

  const [currentVolunteer, setCurrentVolunteer] = useState<VolunteerRow | null>(null);
  const [availableTasks, setAvailableTasks] = useState<TaskRow[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage("");
    setMessage("");

    const [volunteerResult, tasksResult] = await Promise.all([
      supabase
        .from("volunteers")
        .select("id, name, status")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),

      supabase
        .from("tasks")
        .select(
          "id, title, type, location, urgency, priority, description, status, assigned_volunteer_id, created_at",
        )
        .eq("status", "Available")
        .order("created_at", { ascending: false }),
    ]);

    if (volunteerResult.error) {
      setCurrentVolunteer(null);
    } else {
      setCurrentVolunteer(volunteerResult.data as VolunteerRow | null);
    }

    if (tasksResult.error) {
      setErrorMessage("Could not load available tasks from Supabase.");
      setAvailableTasks([]);
    } else {
      setAvailableTasks((tasksResult.data || []) as TaskRow[]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const verified = currentVolunteer?.status === "Verified";

  const incompleteTaskCount = useMemo(
    () => availableTasks.filter((task) => getMissingTaskFields(task).length > 0).length,
    [availableTasks],
  );

  const validTaskCount = availableTasks.length - incompleteTaskCount;

  const accept = async (task: TaskRow) => {
    setMessage("");

    if (!currentVolunteer || currentVolunteer.status !== "Verified") {
      setMessage("The task could not be accepted. Only a Verified volunteer can accept tasks.");
      return;
    }

    const missingFields = getMissingTaskFields(task);

    if (missingFields.length > 0) {
      setMessage(
        `This task is missing ${missingFields.join(
          ", ",
        )}. Ask an admin to complete the task details before accepting it.`,
      );
      return;
    }

    const { error } = await supabase
      .from("tasks")
      .update({
        status: "Accepted",
        assigned_volunteer_id: currentVolunteer.id,
      })
      .eq("id", task.id)
      .eq("status", "Available");

    if (error) {
      setMessage("The task could not be accepted. Please try again.");
      return;
    }

    setAvailableTasks((current) => current.filter((item) => item.id !== task.id));
    setMessage(`${task.title} was moved to My Tasks with Accepted status.`);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: "Available Tasks" }} />

      <SectionTitle
        title="Available & Nearby Tasks"
        subtitle="Review task details and validation warnings before accepting volunteer work."
      />

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{availableTasks.length}</Text>
          <Text style={styles.summaryLabel}>Available</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{validTaskCount}</Text>
          <Text style={styles.summaryLabel}>Complete details</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={[styles.summaryNumber, styles.warningNumber]}>
            {incompleteTaskCount}
          </Text>
          <Text style={styles.summaryLabel}>Need review</Text>
        </Card>
      </View>

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
      ) : null}

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
        <Card accentColor={message.includes("moved") ? COLORS.success : COLORS.warning}>
          <Text style={styles.message}>{message}</Text>

          {message.includes("moved") ? (
            <AppButton
              title="Open My Tasks"
              onPress={() => router.push("/volunteer/my-tasks" as any)}
              variant="success"
            />
          ) : null}
        </Card>
      ) : null}

      {!isLoading && !errorMessage && availableTasks.length === 0 ? (
        <EmptyState
          icon="📌"
          title="No available tasks"
          message="New available tasks will appear here when coordinators publish them."
        />
      ) : (
        availableTasks.map((task) => {
          const missingFields = getMissingTaskFields(task);
          const taskIsComplete = missingFields.length === 0;

          return (
            <Card
              key={task.id}
              accentColor={
                !taskIsComplete
                  ? COLORS.warning
                  : task.priority === "Urgent"
                    ? COLORS.emergency
                    : COLORS.primary
              }
            >
              <View style={styles.headerRow}>
                <View style={styles.titleWrap}>
                  <Text style={styles.title}>
                    {getDisplayValue(task.title, "Untitled task")}
                  </Text>
                  <Text style={styles.type}>
                    {getDisplayValue(task.type, "Task type missing")}
                  </Text>
                </View>

                <View style={styles.badges}>
                  <StatusBadge label={getDisplayValue(task.priority, "Missing")} />
                  <StatusBadge label={taskIsComplete ? "Complete" : "Incomplete"} />
                </View>
              </View>

              {!taskIsComplete ? (
                <Card accentColor={COLORS.warning} style={styles.validationCard}>
                  <Text style={styles.validationTitle}>Missing task details</Text>
                  <Text style={styles.validationText}>
                    Required field(s): {missingFields.join(", ")}. This task cannot be
                    accepted until the missing details are added.
                  </Text>
                </Card>
              ) : null}

              <Text style={styles.label}>General location</Text>
              <Text style={styles.value}>
                {getDisplayValue(task.location, "Location missing")}
              </Text>

              <Text style={styles.label}>Urgency</Text>
              <Text style={styles.value}>
                {getDisplayValue(task.urgency, "Urgency missing")}
              </Text>

              <Text style={styles.description}>
                {getDisplayValue(task.description, "Description missing")}
              </Text>

              <AppButton
                title={taskIsComplete ? "Accept Task" : "Cannot Accept Yet"}
                onPress={() => accept(task)}
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
  type: {
    color: COLORS.textSecondary,
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
    marginTop: SPACING.md,
  },
  acceptButton: {
    marginTop: SPACING.md,
  },
});