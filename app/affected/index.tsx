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
  const { alerts, helpRequests, publishedShelters, publishedEmergencyResources } =
    useAppContext();

  const openCount = helpRequests.filter((item) => item.status !== "Resolved").length;
  const resolvedCount = helpRequests.filter((item) => item.status === "Resolved").length;
  const urgentCount = helpRequests.filter((item) => item.priority === "Urgent").length;
  const totalPublishedBeds = publishedShelters.reduce(
    (total, shelter) => total + shelter.availableBeds,
    0,
  );

  const totalResourceCount = publishedEmergencyResources.length + publishedShelters.length;

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
      title: "Warnings & Updates",
      description: "View emergency broadcasts, affected areas, and safety instructions.",
      route: "/affected/warnings-updates",
      icon: "⚠️",
    },
    {
      title: "Resources",
      description:
        "Filter published emergency resources by food, water, medical, or shelter type.",
      route: "/affected/resources",
      icon: "📦",
    },
    {
      title: "Nearby Shelters",
      description: "View only shelters published as available inside RescueBridge.",
      route: "/affected/nearby-shelters",
      icon: "🏠",
    },
    {
      title: "Nearby Resources",
      description: "Filter nearby support by Shelter, Food, Water, or Medical.",
      route: "/affected/nearby-resources",
      icon: "📍",
    },
  ] as const;

  return (
    <Screen>
      <Stack.Screen options={{ title: "Affected Individual" }} />

      <SectionTitle
        title="Affected Individual Dashboard"
        subtitle="Submit urgent needs, track requests, and view available resources published through RescueBridge."
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

      <Card accentColor={ROLE_COLORS.affected.main} style={styles.priorityCard}>
        <View style={styles.inline}>
          <StatusBadge label="Iteration 2" />
          <Text style={styles.priorityText}>
            Affected users can now view warnings, filter resources, and navigate to support locations.
          </Text>
        </View>
      </Card>

      <View style={styles.resourceSummary}>
        <Card style={styles.resourceCard}>
          <Text style={styles.resourceIcon}>⚠️</Text>
          <Text style={styles.resourceNumber}>{alerts.length}</Text>
          <Text style={styles.resourceLabel}>Active alerts</Text>
        </Card>

        <Card style={styles.resourceCard}>
          <Text style={styles.resourceIcon}>📦</Text>
          <Text style={styles.resourceNumber}>{totalResourceCount}</Text>
          <Text style={styles.resourceLabel}>Published resources</Text>
        </Card>

        <Card style={styles.resourceCard}>
          <Text style={styles.resourceIcon}>🛏️</Text>
          <Text style={styles.resourceNumber}>{totalPublishedBeds}</Text>
          <Text style={styles.resourceLabel}>Beds available</Text>
        </Card>
      </View>

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
  resourceSummary: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  resourceCard: {
    flex: 1,
    alignItems: "center",
    padding: SPACING.md,
  },
  resourceIcon: {
    fontSize: 22,
    marginBottom: SPACING.xs,
  },
  resourceNumber: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
  },
  resourceLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    textAlign: "center",
    marginTop: 2,
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