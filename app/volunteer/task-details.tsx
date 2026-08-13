import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";
import StatusBadge from "../../components/StatusBadge";
import { COLORS, FONT_SIZE, SPACING } from "../../constants/theme";
import { supabase } from "../../lib/supabase";

type TaskRow = {
  id: string;
  title: string;
  type: string;
  location: string;
  urgency: string;
  priority: string;
  description: string;
  status: string;
  assigned_volunteer_id: string | null;
  assigned_volunteer_name: string | null;
  created_at: string;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export default function TaskDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [task, setTask] = useState<TaskRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadTask = async () => {
    if (!id) {
      setErrorMessage("No task ID provided.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      setErrorMessage("Could not load task details from Supabase.");
      setTask(null);
    } else {
      setTask(data as TaskRow);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadTask();
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available": return COLORS.primary;
      case "Accepted": return COLORS.warning;
      case "Active": return COLORS.info;
      case "Completed": return COLORS.success;
      default: return COLORS.textMuted;
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: "Task Details" }} />

      <SectionTitle
        title="Task Details"
        subtitle="View the task type, location area, and urgency."
      />

      {isLoading ? (
        <Card>
          <Text style={styles.loadingText}>Loading task details...</Text>
        </Card>
      ) : errorMessage ? (
        <Card accentColor={COLORS.emergency} style={styles.errorCard}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <AppButton title="Try Again" onPress={loadTask} variant="danger" />
        </Card>
      ) : !task ? (
        <Card>
          <Text style={styles.loadingText}>Task not found.</Text>
        </Card>
      ) : (
        <>
          <Card
            accentColor={
              task.priority === "Urgent"
                ? COLORS.emergency
                : task.status === "Completed"
                ? COLORS.success
                : COLORS.primary
            }
          >
            <View style={styles.headerRow}>
              <View style={styles.titleWrap}>
                <Text style={styles.title}>{task.title}</Text>
                <Text style={styles.type}>{task.type}</Text>
              </View>
              <StatusBadge label={task.priority} />
            </View>

            <View style={styles.badgeRow}>
              <StatusBadge 
                label={task.status} 
                tone={
                  task.status === "Completed" ? "completed" :
                  task.status === "Active" ? "active" :
                  task.status === "Accepted" ? "accepted" :
                  "available"
                } 
              />
              {task.assigned_volunteer_name ? (
                <Text style={styles.assigned}>
                  👤 {task.assigned_volunteer_name}
                </Text>
              ) : (
                <Text style={styles.assigned}>No volunteer assigned</Text>
              )}
            </View>

            <Detail label="Location" value={task.location} />
            <Detail label="Urgency" value={task.urgency} />
            <Detail label="Created" value={formatDate(task.created_at)} />
            <Detail label="Description" value={task.description} />

            {/* Status indicator */}
            <Card accentColor={getStatusColor(task.status)} style={styles.statusCard}>
              <Text style={styles.statusCardTitle}>
                Status: {task.status}
              </Text>
              <Text style={styles.statusCardText}>
                {task.status === "Available" && "This task is open for volunteers to accept."}
                {task.status === "Accepted" && "A volunteer has accepted this task and will start soon."}
                {task.status === "Active" && "This task is currently in progress."}
                {task.status === "Completed" && "This task has been completed."}
              </Text>
            </Card>
          </Card>

          <View style={styles.buttonRow}>
            <AppButton
              title="Back"
              onPress={() => router.back()}
              variant="outline"
              style={styles.flex}
            />

            {task.status === "Available" && (
              <AppButton
                title="Accept Task"
                onPress={() => {
                  router.push({
                    pathname: "/volunteer/available-tasks" as any,
                    params: { accept: task.id },
                  });
                }}
                variant="success"
                style={styles.flex}
              />
            )}
          </View>
        </>
      )}
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
  type: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginVertical: SPACING.md,
    flexWrap: "wrap",
  },
  assigned: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
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
  statusCard: {
    backgroundColor: COLORS.primaryLight,
    marginTop: SPACING.md,
  },
  statusCardTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZE.md,
    fontWeight: "800",
  },
  statusCardText: {
    color: COLORS.textSecondary,
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
});