import { Stack, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import Card from "../../components/Card";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";
import StatusBadge from "../../components/StatusBadge";
import { COLORS, FONT_SIZE, ROLE_COLORS, SPACING } from "../../constants/theme";
import { useAppContext } from "../../context/AppContext";

export default function AdminDashboard() {
  const router = useRouter();
  const { helpRequests, volunteers } = useAppContext();

  const openRequests = helpRequests.filter(
    (item) => item.status !== "Resolved"
  ).length;

  const urgentRequests = helpRequests.filter(
    (item) => item.priority === "Urgent"
  ).length;

  const pendingVolunteers = volunteers.filter(
    (item) => item.status === "Pending"
  ).length;

  const links = [
    {
      title: "Manage Help Requests",
      description:
        "Review urgency, update status, assign volunteers, and resolve requests.",
      route: "/admin/manage-help-requests",
      icon: "🆘",
    },
    {
      title: "Volunteer Approval",
      description:
        "Review pending volunteer details and approve or reject applications.",
      route: "/admin/volunteer-approval",
      icon: "✅",
    },
    {
      title: "Incident Reports",
      description:
        "Inspect community incident reports and verify, reject, or update status.",
      route: "/admin/incident-reports",
      icon: "🚨",
    },
  ] as const;

  return (
    <Screen>
      <Stack.Screen options={{ title: "Admin / Coordinator" }} />

      <SectionTitle
        title="Coordinator Dashboard"
        subtitle="Iteration Planning 1 screens for managing help requests and volunteer approvals."
      />

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{openRequests}</Text>
          <Text style={styles.summaryLabel}>Open requests</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{urgentRequests}</Text>
          <Text style={styles.summaryLabel}>Urgent requests</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{pendingVolunteers}</Text>
          <Text style={styles.summaryLabel}>Volunteer reviews</Text>
        </Card>
      </View>

      <Card accentColor={ROLE_COLORS.admin.main} style={styles.infoCard}>
        <View style={styles.inline}>
          <StatusBadge label="Iteration 1" />
          <Text style={styles.infoText}>
            This section focuses on M11 Manage Help Requests and M12 Review and
            Approve or Reject Volunteers.
          </Text>
        </View>
      </Card>

      <Card accentColor={COLORS.primary} style={styles.alertSummary}>
        <Text style={styles.alertSummaryTitle}>Coordinator demo flow</Text>
        <Text style={styles.alertSummaryText}>
          Use this dashboard to update request status, assign volunteers, resolve
          requests, and approve or reject volunteer applications using local mock
          data.
        </Text>
      </Card>

      {links.map((link) => (
        <Card
          key={link.route}
          onPress={() => router.push(link.route as any)}
          accentColor={ROLE_COLORS.admin.main}
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
    color: ROLE_COLORS.admin.main,
    fontSize: FONT_SIZE.xl,
    fontWeight: "900",
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    textAlign: "center",
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: ROLE_COLORS.admin.light,
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
  alertSummary: {
    backgroundColor: COLORS.primaryLight,
  },
  alertSummaryTitle: {
    color: COLORS.primaryDark,
    fontWeight: "800",
    fontSize: FONT_SIZE.sm,
  },
  alertSummaryText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.xs,
    lineHeight: 18,
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
    color: ROLE_COLORS.admin.main,
    fontSize: 32,
  },
});
