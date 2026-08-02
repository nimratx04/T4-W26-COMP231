import { Stack, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import Card from "../../components/Card";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";
import StatusBadge from "../../components/StatusBadge";
import { COLORS, FONT_SIZE, ROLE_COLORS, SPACING } from "../../constants/theme";
import { useAppContext } from "../../context/AppContext";

export default function ReporterDashboard() {
  const router = useRouter();
  const { incidentReports } = useAppContext();

  const pendingCount = incidentReports.filter(
    (item) => item.status === "Pending Verification"
  ).length;

  const verifiedCount = incidentReports.filter(
    (item) => item.status === "Verified" || item.status === "Responding"
  ).length;

  const resolvedCount = incidentReports.filter(
    (item) => item.status === "Resolved"
  ).length;

  const links = [
    {
      title: "Report Incident",
      description: "Report a flood, fire, power outage, or blocked road.",
      route: "/reporters/report-incident",
      icon: "🚨",
    },
    {
      title: "My Reports",
      description: "Track pending, verified, responding, or resolved reports.",
      route: "/reporters/my-reports",
      icon: "📋",
    },
    {
      title: "Community Alerts",
      description: "View safety notices, incident updates, and affected areas.",
      route: "/reporters/community-alerts",
      icon: "🔔",
    },
  ] as const;

  return (
    <Screen>
      <Stack.Screen options={{ title: "Community Reporter" }} />

      <SectionTitle
        title="Community Reporter Dashboard"
        subtitle="Iteration Planning 2 screens for incident reporting, tracking, and community alerts."
      />

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{pendingCount}</Text>
          <Text style={styles.summaryLabel}>Pending reports</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{verifiedCount}</Text>
          <Text style={styles.summaryLabel}>Active reports</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{resolvedCount}</Text>
          <Text style={styles.summaryLabel}>Resolved</Text>
        </Card>
      </View>

      <Card accentColor={ROLE_COLORS.reporter.main} style={styles.infoCard}>
        <View style={styles.inline}>
          <StatusBadge label="Iteration 2" />
          <Text style={styles.infoText}>
            This section focuses on M14 Create an Incident Report, M15 Submit an
            Incident Report, S8 View and Track Submitted Reports, C1 Attach an
            Optional Photo, and C2 View Community Alerts.
          </Text>
        </View>
      </Card>

      {links.map((link) => (
        <Card
          key={link.route}
          onPress={() => router.push(link.route)}
          accentColor={ROLE_COLORS.reporter.main}
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
    color: ROLE_COLORS.reporter.main,
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
    backgroundColor: ROLE_COLORS.reporter.light,
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
    color: ROLE_COLORS.reporter.main,
    fontSize: 32,
  },
});