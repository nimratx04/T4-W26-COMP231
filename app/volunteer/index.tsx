import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";
import StatusBadge from "../../components/StatusBadge";
import { COLORS, FONT_SIZE, ROLE_COLORS, SPACING } from "../../constants/theme";
import { supabase } from "../../lib/supabase";

type VolunteerRow = {
  id: string;
  name: string | null;
  email: string | null;
  status: string | null;
  result_message: string | null;
  created_at: string | null;
};

type TaskRow = {
  id: string;
  status: string | null;
  assigned_volunteer_id: string | null;
};

export default function VolunteerDashboard() {
  const router = useRouter();

  const [currentVolunteer, setCurrentVolunteer] = useState<VolunteerRow | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadDashboard = async () => {
    setIsLoading(true);
    setErrorMessage("");

    const [volunteerResult, tasksResult] = await Promise.all([
      supabase
        .from("volunteers")
        .select("id, name, email, status, result_message, created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),

      supabase.from("tasks").select("id, status, assigned_volunteer_id"),
    ]);

    if (volunteerResult.error) {
      setCurrentVolunteer(null);
      setErrorMessage("Could not load volunteer profile from Supabase.");
    } else {
      setCurrentVolunteer(volunteerResult.data as VolunteerRow | null);
    }

    if (tasksResult.error) {
      setTasks([]);
    } else {
      setTasks((tasksResult.data || []) as TaskRow[]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const availableCount = useMemo(
    () => tasks.filter((task) => task.status === "Available").length,
    [tasks],
  );

  const myTaskCount = useMemo(
    () =>
      currentVolunteer
        ? tasks.filter((task) => task.assigned_volunteer_id === currentVolunteer.id).length
        : 0,
    [tasks, currentVolunteer],
  );

  const volunteerName = currentVolunteer?.name || "No volunteer submitted";
  const volunteerStatus = currentVolunteer?.status || "Not Submitted";
  const resultMessage =
    currentVolunteer?.result_message ||
    "Submit verification information first, then wait for admin review.";

  const verified = currentVolunteer?.status === "Verified";

  const links = [
    {
      title: "Submit Verification",
      description:
        "Provide ID, police-check reference, emergency contact, and safety agreement.",
      route: "/volunteer/verification-form",
      icon: "🪪",
    },
    {
      title: "Verification Status",
      description: "Check Pending, Verified, Rejected, or Expired status.",
      route: "/volunteer/verification-status",
      icon: "🔐",
    },
    {
      title: "Available Tasks",
      description: "View available tasks with priority and general location.",
      route: "/volunteer/available-tasks",
      icon: "📌",
    },
    {
      title: "My Tasks",
      description: "Manage accepted, active, and completed task progress.",
      route: "/volunteer/my-tasks",
      icon: "🧰",
    },
  ] as const;

  return (
    <Screen>
      <Stack.Screen options={{ title: "Volunteer" }} />

      <SectionTitle
        title="Volunteer Dashboard"
        subtitle="View verification status, available tasks, and volunteer task progress."
      />

      {isLoading ? (
        <Card>
          <Text style={styles.loadingText}>Loading volunteer dashboard...</Text>
        </Card>
      ) : errorMessage ? (
        <Card accentColor={COLORS.emergency} style={styles.errorCard}>
          <Text style={styles.errorTitle}>Database error</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <AppButton title="Try Again" onPress={loadDashboard} variant="danger" />
        </Card>
      ) : null}

      {!isLoading ? (
        <>
          <Card accentColor={verified ? COLORS.success : ROLE_COLORS.volunteer.main}>
            <Text style={styles.name}>{volunteerName}</Text>

            <View style={styles.statusRow}>
              <StatusBadge label={volunteerStatus} />
              <Text style={styles.statusText}>{resultMessage}</Text>
            </View>
          </Card>

          <View style={styles.summaryRow}>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{availableCount}</Text>
              <Text style={styles.summaryLabel}>Available tasks</Text>
            </Card>

            <Card style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{myTaskCount}</Text>
              <Text style={styles.summaryLabel}>My tasks</Text>
            </Card>
          </View>

          <Card accentColor={ROLE_COLORS.volunteer.main} style={styles.infoCard}>
            <View style={styles.inline}>
              <StatusBadge label="Iteration 2" />
              <Text style={styles.infoText}>
                Volunteer status is now loaded from Supabase, so Dashboard,
                Verification Status, and Admin Approval stay consistent.
              </Text>
            </View>
          </Card>

          {!verified ? (
            <Card accentColor={COLORS.warning} style={styles.notice}>
              <Text style={styles.noticeTitle}>Task access is restricted.</Text>
              <Text style={styles.noticeText}>
                {currentVolunteer
                  ? `Open the Admin dashboard and approve ${volunteerName} to test the full volunteer flow.`
                  : "Submit verification information first. Then Admin can approve the volunteer."}
              </Text>
            </Card>
          ) : (
            <Card accentColor={COLORS.success} style={styles.accessCard}>
              <Text style={styles.accessTitle}>Task access enabled</Text>
              <Text style={styles.accessText}>
                This volunteer is verified and can now view, accept, and manage tasks.
              </Text>
            </Card>
          )}

          {links.map((link) => (
            <Card
              key={link.route}
              onPress={() => router.push(link.route as any)}
              accentColor={ROLE_COLORS.volunteer.main}
            >
              <View style={styles.linkRow}>
                <Text style={styles.icon}>{link.icon}</Text>

                <View style={styles.linkText}>
                  <Text style={styles.linkTitle}>{link.title}</Text>
                  <Text style={styles.linkDescription}>{link.description}</Text>
                </View>

                <Text style={styles.arrow}>›</Text>
              </View>
            </Card>
          ))}

          <AppButton title="Refresh Dashboard" onPress={loadDashboard} variant="secondary" />
        </>
      ) : null}
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
  name: {
    color: COLORS.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: "900",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  statusText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 19,
  },
  summaryRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  summaryCard: {
    flex: 1,
    alignItems: "center",
  },
  summaryNumber: {
    color: ROLE_COLORS.volunteer.main,
    fontSize: FONT_SIZE.xl,
    fontWeight: "900",
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
    textAlign: "center",
  },
  infoCard: {
    backgroundColor: ROLE_COLORS.volunteer.light,
  },
  inline: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  infoText: {
    color: COLORS.text,
    flex: 1,
    fontSize: FONT_SIZE.sm,
    lineHeight: 19,
  },
  notice: {
    backgroundColor: COLORS.warningLight,
  },
  noticeTitle: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: FONT_SIZE.sm,
  },
  noticeText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
    marginTop: SPACING.xs,
  },
  accessCard: {
    backgroundColor: COLORS.successLight,
  },
  accessTitle: {
    color: COLORS.success,
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
  },
  accessText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
    marginTop: SPACING.xs,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  linkText: {
    flex: 1,
  },
  linkTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: "800",
  },
  linkDescription: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    marginTop: 2,
  },
  arrow: {
    color: ROLE_COLORS.volunteer.main,
    fontSize: 32,
  },
});