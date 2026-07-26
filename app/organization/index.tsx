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
  const { resources, organizationStatus, resourceDraft } = useAppContext();

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
  ] as const;

  return (
    <Screen>
      <Stack.Screen options={{ title: "Organization Staff" }} />

      <SectionTitle
        title="Organization Staff Dashboard"
        subtitle="Iteration Planning 1 screens for updating resources and organization status."
      />

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{resources.beds}</Text>
          <Text style={styles.summaryLabel}>Beds</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <StatusBadge label={organizationStatus.status} />
          <Text style={styles.summaryLabel}>Current status</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {resourceDraft ? "1" : "0"}
          </Text>
          <Text style={styles.summaryLabel}>Draft updates</Text>
        </Card>
      </View>

      <Card accentColor={ROLE_COLORS.organization.main} style={styles.infoCard}>
        <View style={styles.inline}>
          <StatusBadge label="Iteration 1" />
          <Text style={styles.infoText}>
            This section focuses on M3 Update Resource Availability, M4 Review and Save Resource Changes, and M5 Update Organization Status.
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
