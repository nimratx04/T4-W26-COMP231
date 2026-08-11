import { Stack, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import Card from "../../components/Card";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";
import StatusBadge from "../../components/StatusBadge";
import { COLORS, FONT_SIZE, ROLE_COLORS, SPACING } from "../../constants/theme";
import { useAppContext } from "../../context/AppContext";

export default function AffectedDashboard() {
  const router = useRouter();
  const { helpRequests } = useAppContext();

  const openCount = helpRequests.filter((item) => item.status !== "Resolved").length;
  const resolvedCount = helpRequests.filter((item) => item.status === "Resolved").length;
  const urgentCount = helpRequests.filter((item) => item.priority === "Urgent").length;

  const links = [
    {
      title: "Request Help",
      description: "Submit shelter, food, water, medical, or transportation needs.",
      route: "/affected/submit-help",
      icon: "🆘",
    },
    {
      title: "My Requests",
      description: "Track pending, active, and resolved help requests.",
      route: "/affected/my-requests",
      icon: "📋",
    },
    {
      title: "Nearby Shelters",
      description:
        "View nearby shelters sorted by distance.",
      route: "/affected/nearby-resources?category=Shelter",
      icon: "🏠",
    },
    {
      title: "Nearby Resources",
      description:
        "Filter nearby support by Shelter, Food, Water, or Medical.",
      route: "/affected/nearby-resources",
      icon: "📍",
    },
  ] as const;

  return (
    <Screen>
      <Stack.Screen options={{ title: "Affected Individual" }} />

      <SectionTitle
        title="Affected Individual Dashboard"
        subtitle="Iteration Planning 1 screens for submitting and tracking emergency help requests."
      />

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{openCount}</Text>
          <Text style={styles.summaryLabel}>Open requests</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{resolvedCount}</Text>
          <Text style={styles.summaryLabel}>Resolved</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{urgentCount}</Text>
          <Text style={styles.summaryLabel}>Urgent</Text>
        </Card>
      </View>

      <Card accentColor={COLORS.emergency} style={styles.priorityCard}>
        <View style={styles.inline}>
          <StatusBadge label="Iteration 1" />
          <Text style={styles.priorityText}>
            This section focuses on M1 Submit a Help Request and M2 View and Track Submitted Requests.
          </Text>
        </View>
      </Card>

      {links.map((link) => (
        <Card
          key={link.route}
          onPress={() => router.push(link.route as any)}
          accentColor={ROLE_COLORS.affected.main}
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
    color: ROLE_COLORS.affected.main,
    fontSize: FONT_SIZE.xl,
    fontWeight: "900",
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    textAlign: "center",
    marginTop: 2,
  },
  priorityCard: {
    backgroundColor: COLORS.emergencyLight,
  },
  inline: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  priorityText: {
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
    color: ROLE_COLORS.affected.main,
    fontSize: 32,
  },
});
