import { Stack, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import Card from "../../components/Card";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";
import StatusBadge from "../../components/StatusBadge";
import { COLORS, FONT_SIZE, ROLE_COLORS, SPACING } from "../../constants/theme";
import { useAppContext } from "../../context/AppContext";

export default function OrganizationDashboard() {
  const router = useRouter();
  const {
    resources,
    organizationStatus,
    resourceDraft,
    shelters,
    publishedShelters,
    emergencyResources,
    publishedEmergencyResources,
  } = useAppContext();

  const links = [
    {
      title: "Update Resources",
      description: "Enter beds, food, water, supplies, medical support, and hours.",
      route: "/organization/update-resources",
      icon: "📦",
    },
    {
      title: "Review & Save",
      description: "Review the latest resource changes before publishing.",
      route: "/organization/review-save-resources",
      icon: "✅",
    },
    {
      title: "Organization Status",
      description: "Set Open, Limited, Full, or Closed with an optional note.",
      route: "/organization/update-status",
      icon: "🏢",
    },
    {
      title: "Manage Shelters",
      description: "Add, edit, publish, hide, or delete shelters shown to affected users.",
      route: "/organization/manage-shelters",
      icon: "🏠",
    },
    {
      title: "Manage Resources",
      description: "Add, edit, publish, hide, or delete food, water, and medical resources.",
      route: "/organization/manage-resources",
      icon: "🧰",
    },
  ] as const;

  return (
    <Screen>
      <Stack.Screen options={{ title: "Organization Staff" }} />

      <SectionTitle
        title="Organization Staff Dashboard"
        subtitle="Update resources, publish shelter availability, and control what affected users can see."
      />

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{resources.beds}</Text>
          <Text style={styles.summaryLabel}>Resource beds</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <StatusBadge label={organizationStatus.status} />
          <Text style={styles.summaryLabel}>Current status</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{publishedShelters.length}</Text>
          <Text style={styles.summaryLabel}>Published shelters</Text>
        </Card>
      </View>

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{emergencyResources.length}</Text>
          <Text style={styles.summaryLabel}>All resources</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{publishedEmergencyResources.length}</Text>
          <Text style={styles.summaryLabel}>Published resources</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {publishedEmergencyResources.reduce(
              (total, resource) => total + resource.quantity,
              0,
            )}
          </Text>
          <Text style={styles.summaryLabel}>Visible units</Text>
        </Card>
      </View>

      <Card accentColor={ROLE_COLORS.organization.main} style={styles.infoCard}>
        <View style={styles.inline}>
          <StatusBadge label="Iteration 2" />
          <Text style={styles.infoText}>
            Organizations now control both published shelters and published emergency resources.
          </Text>
        </View>
      </Card>

      {resourceDraft ? (
        <Card accentColor={COLORS.warning} style={styles.notice}>
          <Text style={styles.noticeTitle}>
            Resource changes are waiting for confirmation.
          </Text>
          <Text style={styles.noticeText}>
            Open Review & Save to publish the staged update.
          </Text>
        </Card>
      ) : null}

      <Card accentColor={COLORS.primary} style={styles.shelterStatusCard}>
        <Text style={styles.shelterStatusTitle}>Publishing status</Text>
        <Text style={styles.shelterStatusText}>
          {publishedShelters.length} of {shelters.length} shelter records and{" "}
          {publishedEmergencyResources.length} of {emergencyResources.length} emergency resource
          records are currently visible to affected users.
        </Text>
        <Text style={styles.shelterStatusNote}>
          Records appear to users only when published, available, and Open or Limited.
        </Text>
      </Card>

      {links.map((link) => (
        <Card
          key={link.route}
          onPress={() => router.push(link.route as any)}
          accentColor={ROLE_COLORS.organization.main}
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
    justifyContent: "center",
    padding: SPACING.md,
  },
  summaryNumber: {
    color: ROLE_COLORS.organization.main,
    fontSize: FONT_SIZE.xl,
    fontWeight: "900",
    textAlign: "center",
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    textAlign: "center",
    marginTop: SPACING.xs,
  },
  infoCard: {
    backgroundColor: ROLE_COLORS.organization.light,
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
    marginTop: SPACING.xs,
  },
  shelterStatusCard: {
    backgroundColor: COLORS.infoLight,
  },
  shelterStatusTitle: {
    color: COLORS.primaryDark,
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
  },
  shelterStatusText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    marginTop: SPACING.xs,
  },
  shelterStatusNote: {
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
    color: ROLE_COLORS.organization.main,
    fontSize: 32,
  },
});