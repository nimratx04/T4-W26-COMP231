import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";
import SelectOption from "../../components/SelectOption";
import StatusBadge from "../../components/StatusBadge";
import { COLORS, FONT_SIZE, ROLE_COLORS, SPACING } from "../../constants/theme";
import { supabase } from "../../lib/supabase";

type AlertFilter = "All" | "Urgent" | "High" | "Medium" | "Low";

type AlertRow = {
  id: string;
  title: string;
  message: string;
  area: string;
  priority: string;
  type: string;
  instructions: string | null;
  created_at: string;
};

const filters: AlertFilter[] = ["All", "Urgent", "High", "Medium", "Low"];

const getPriorityAccent = (priority: string) => {
  switch (priority) {
    case "Urgent":
      return COLORS.emergency;
    case "High":
      return COLORS.warning;
    case "Medium":
      return COLORS.primary;
    case "Low":
      return COLORS.success;
    default:
      return ROLE_COLORS.affected.main;
  }
};

const formatDateTime = (isoDate: string) =>
  new Date(isoDate).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function AffectedWarningsUpdatesScreen() {
  const router = useRouter();

  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<AlertFilter>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [readAlertIds, setReadAlertIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadAlerts = async () => {
    setIsLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("alerts")
      .select("id, title, message, area, priority, type, instructions, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setAlerts([]);
      setErrorMessage(`Could not load warnings and updates: ${error.message}`);
    } else {
      setAlerts((data || []) as AlertRow[]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const filteredAlerts = useMemo(
    () =>
      alerts.filter((alert) =>
        selectedFilter === "All" ? true : alert.priority === selectedFilter,
      ),
    [alerts, selectedFilter],
  );

  const urgentCount = alerts.filter((alert) => alert.priority === "Urgent").length;
  const unreadCount = alerts.filter((alert) => !readAlertIds.includes(alert.id)).length;

  const toggleExpanded = (alert: AlertRow) => {
    setExpandedId((current) => (current === alert.id ? null : alert.id));

    setReadAlertIds((current) =>
      current.includes(alert.id) ? current : [...current, alert.id],
    );
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: "Warnings & Updates" }} />

      <SectionTitle
        title="Warnings & Updates Feed"
        subtitle="View emergency broadcasts, safety warnings, affected areas, and official instructions."
      />

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{alerts.length}</Text>
          <Text style={styles.summaryLabel}>Total updates</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={[styles.summaryNumber, styles.urgentNumber]}>{urgentCount}</Text>
          <Text style={styles.summaryLabel}>Urgent</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{unreadCount}</Text>
          <Text style={styles.summaryLabel}>Unread</Text>
        </Card>
      </View>

      <Card accentColor={ROLE_COLORS.affected.main} style={styles.filterCard}>
        <Text style={styles.filterTitle}>Filter by priority</Text>

        <View style={styles.filterGrid}>
          {filters.map((filter) => (
            <View key={filter} style={styles.filterItem}>
              <SelectOption
                label={filter}
                selected={selectedFilter === filter}
                onPress={() => setSelectedFilter(filter)}
              />
            </View>
          ))}
        </View>

        <Text style={styles.filterNote}>
          Updates are loaded from the same alerts table used by Admin broadcasts.
        </Text>
      </Card>

      {isLoading ? (
        <Card>
          <Text style={styles.message}>Loading warnings and updates...</Text>
        </Card>
      ) : errorMessage ? (
        <Card accentColor={COLORS.emergency}>
          <Text style={styles.message}>{errorMessage}</Text>
          <AppButton title="Try Again" onPress={loadAlerts} variant="danger" />
        </Card>
      ) : filteredAlerts.length === 0 ? (
        <EmptyState
          icon="⚠️"
          title="No warnings found"
          message="No warnings or updates match this filter right now."
          actionTitle="Refresh"
          onAction={loadAlerts}
        />
      ) : (
        filteredAlerts.map((alert) => {
          const expanded = expandedId === alert.id;
          const isRead = readAlertIds.includes(alert.id);

          return (
            <Card key={alert.id} accentColor={getPriorityAccent(alert.priority)}>
              <View style={styles.alertHeader}>
                <View style={styles.alertTitleWrap}>
                  <View style={styles.titleRow}>
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                    {!isRead ? <Text style={styles.unreadDot}>●</Text> : null}
                  </View>

                  <Text style={styles.alertMeta}>
                    {alert.area} • {formatDateTime(alert.created_at)}
                  </Text>
                </View>

                <View style={styles.badges}>
                  <StatusBadge label={alert.priority} />
                  <StatusBadge label={isRead ? "Read" : "New"} />
                </View>
              </View>

              <Card style={styles.innerCard}>
                <Text style={styles.innerLabel}>Message</Text>
                <Text style={styles.innerText}>{alert.message}</Text>
              </Card>

              {expanded ? (
                <Card style={styles.instructionCard}>
                  <Text style={styles.innerLabel}>Instructions</Text>
                  <Text style={styles.innerText}>
                    {alert.instructions?.trim() ||
                      "No extra instructions were added for this update."}
                  </Text>

                  <View style={styles.detailRow}>
                    <View style={styles.detailBox}>
                      <Text style={styles.detailLabel}>Type</Text>
                      <Text style={styles.detailValue}>{alert.type}</Text>
                    </View>

                    <View style={styles.detailBox}>
                      <Text style={styles.detailLabel}>Affected area</Text>
                      <Text style={styles.detailValue}>{alert.area}</Text>
                    </View>
                  </View>
                </Card>
              ) : null}

              <AppButton
                title={expanded ? "Hide Details" : "View Details"}
                onPress={() => toggleExpanded(alert)}
                variant="secondary"
              />
            </Card>
          );
        })
      )}

      <AppButton title="Refresh Updates" onPress={loadAlerts} variant="secondary" />

      <AppButton
        title="Request Help"
        onPress={() => router.push("/affected/submit-help" as any)}
        variant="danger"
      />

      <AppButton
        title="Back to Affected Dashboard"
        onPress={() => router.push("/affected" as any)}
        variant="outline"
      />
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
  urgentNumber: {
    color: COLORS.emergency,
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    textAlign: "center",
    marginTop: 2,
  },
  filterCard: {
    backgroundColor: ROLE_COLORS.affected.light,
  },
  filterTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    marginBottom: SPACING.md,
  },
  filterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  filterItem: {
    flex: 1,
    minWidth: 120,
  },
  filterNote: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
    marginTop: SPACING.sm,
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
  },
  alertTitleWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  alertTitle: {
    color: COLORS.text,
    flex: 1,
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
  },
  unreadDot: {
    color: COLORS.emergency,
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
  },
  alertMeta: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
    marginTop: 2,
  },
  badges: {
    alignItems: "flex-end",
    gap: SPACING.xs,
  },
  innerCard: {
    backgroundColor: COLORS.surfaceMuted,
    marginBottom: 0,
    marginTop: SPACING.md,
  },
  instructionCard: {
    backgroundColor: COLORS.infoLight,
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
  },
  innerLabel: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
    marginBottom: SPACING.xs,
  },
  innerText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  detailBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.md,
  },
  detailLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.xs,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  detailValue: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: "800",
    marginTop: SPACING.xs,
  },
});