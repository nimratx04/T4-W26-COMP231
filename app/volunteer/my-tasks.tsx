import { Stack, useRouter } from "expo-router";
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

type VolunteerRow = {
  id: string;
  name: string;
  status: string;
};

type TaskStatus = "Accepted" | "Active" | "Completed";

type TaskRow = {
  id: string;
  title: string;
  type: string;
  location: string;
  urgency: string;
  priority: string;
  description: string;
  status: TaskStatus;
  assigned_volunteer_id: string | null;
  created_at: string;
};

const sections: TaskStatus[] = ["Accepted", "Active", "Completed"];

export default function MyTasksScreen() {
  const router = useRouter();

  const [currentVolunteer, setCurrentVolunteer] = useState<VolunteerRow | null>(null);
  const [myTasks, setMyTasks] = useState<TaskRow[]>([]);
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
      setMyTasks([]);
      setErrorMessage("Could not load volunteer information from Supabase.");
      setIsLoading(false);
      return;
    }

    const volunteer = volunteerData as VolunteerRow | null;
    setCurrentVolunteer(volunteer);

    if (!volunteer) {
      setMyTasks([]);
      setIsLoading(false);
      return;
    }

    const { data: taskData, error: taskError } = await supabase
      .from("tasks")
      .select("id, title, type, location, urgency, priority, description, status, assigned_volunteer_id, created_at")
      .eq("assigned_volunteer_id", volunteer.id)
      .in("status", sections)
      .order("created_at", { ascending: false });

    if (taskError) {
      setMyTasks([]);
      setErrorMessage("Could not load your tasks from Supabase.");
    } else {
      setMyTasks((taskData || []) as TaskRow[]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadMyTasks();
  }, []);

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    setMessage("");

    const { error } = await supabase
      .from("tasks")
      .update({ status })
      .eq("id", taskId);

    if (error) {
      setMessage("Task status could not be updated. Please try again.");
      return;
    }

    setMyTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status,
            }
          : task
      )
    );

    setMessage(`Task was updated to ${status}.`);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: "My Tasks" }} />

      <SectionTitle
        title="My Tasks"
        subtitle="Accepted, Active, and Completed tasks are loaded from Supabase."
      />

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
            Submit volunteer verification first. After approval and task acceptance, your assigned tasks will appear here.
          </Text>
          <AppButton
            title="Submit Verification"
            onPress={() => router.push("/volunteer/verification-form" as any)}
            variant="secondary"
          />
        </Card>
      ) : null}

      {message ? (
        <Card accentColor={message.includes("could not") ? COLORS.warning : COLORS.success}>
          <Text style={styles.message}>{message}</Text>
        </Card>
      ) : null}

      {!isLoading && !errorMessage && currentVolunteer && myTasks.length === 0 ? (
        <EmptyState
          icon="🧰"
          title="No accepted tasks"
          message="Accept an available task and it will appear here from Supabase."
          actionTitle="View Available Tasks"
          onAction={() => router.push("/volunteer/available-tasks" as any)}
        />
      ) : (
        sections.map((section) => {
          const items = myTasks.filter((task) => task.status === section);

          return (
            <View key={section} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section}</Text>
                <StatusBadge
                  label={String(items.length)}
                  tone={section === "Completed" ? "completed" : section === "Active" ? "active" : "accepted"}
                />
              </View>

              {items.length === 0 ? (
                <Text style={styles.emptySection}>No {section.toLowerCase()} tasks.</Text>
              ) : (
                items.map((task) => (
                  <TaskCard key={task.id} task={task} updateTaskStatus={updateTaskStatus} />
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

function TaskCard({
  task,
  updateTaskStatus,
}: {
  task: TaskRow;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
}) {
  return (
    <Card
      accentColor={
        task.status === "Completed"
          ? COLORS.success
          : task.priority === "Urgent"
            ? COLORS.emergency
            : COLORS.primary
      }
    >
      <View style={styles.taskHeader}>
        <View style={styles.taskTitleWrap}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <Text style={styles.taskLocation}>{task.location}</Text>
        </View>

        <StatusBadge label={task.status} />
      </View>

      <Text style={styles.taskDescription}>{task.description}</Text>

      {task.status === "Accepted" ? (
        <AppButton title="Mark Active" onPress={() => updateTaskStatus(task.id, "Active")} />
      ) : task.status === "Active" ? (
        <AppButton
          title="Mark Completed"
          onPress={() => updateTaskStatus(task.id, "Completed")}
          variant="success"
        />
      ) : (
        <Text style={styles.completedText}>Completed task retained for progress history.</Text>
      )}
    </Card>
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
  warningCard: {
    backgroundColor: COLORS.warningLight,
  },
  warningTitle: {
    color: COLORS.text,
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
    marginBottom: SPACING.xl,
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
    fontStyle: "italic",
    marginBottom: SPACING.sm,
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
    marginTop: 2,
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
    fontWeight: "700",
  },
});