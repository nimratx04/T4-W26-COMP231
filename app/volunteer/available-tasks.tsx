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
  created_at: string;
};

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
        .select("id, title, type, location, urgency, priority, description, status, assigned_volunteer_id, created_at")
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

  const accept = async (task: TaskRow) => {
    setMessage("");

    if (!currentVolunteer || currentVolunteer.status !== "Verified") {
      setMessage("The task could not be accepted. Only a Verified volunteer can accept tasks.");
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
        subtitle="Available tasks are loaded from Supabase. Verified volunteers can accept tasks."
      />

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
              ? `${currentVolunteer.name} is currently ${currentVolunteer.status}. Only Verified volunteers can accept tasks.`
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
        availableTasks.map((task) => (
          <Card
            key={task.id}
            accentColor={task.priority === "Urgent" ? COLORS.emergency : COLORS.primary}
          >
            <View style={styles.headerRow}>
              <View style={styles.titleWrap}>
                <Text style={styles.title}>{task.title}</Text>
                <Text style={styles.type}>{task.type}</Text>
              </View>

              <StatusBadge label={task.priority} />
            </View>

            <Text style={styles.label}>General location</Text>
            <Text style={styles.value}>{task.location}</Text>

            <Text style={styles.label}>Urgency</Text>
            <Text style={styles.value}>{task.urgency}</Text>

            <Text style={styles.description}>{task.description}</Text>

            <AppButton
              title="Accept Task"
              onPress={() => accept(task)}
              variant="success"
              disabled={!verified}
              style={styles.acceptButton}
            />
          </Card>
        ))
      )}

      <AppButton title="Refresh Tasks" onPress={loadData} variant="secondary" />
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