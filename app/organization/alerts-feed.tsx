
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";
import StatusBadge from "../../components/StatusBadge";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../constants/theme";
import { supabase } from "../../lib/supabase";

type AlertRow = {
  id: string;
  title: string;
  message: string;
  area: string;
  priority: string;
  type: string;
  instructions: string | null;
  created_at: string;
  read: boolean;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "Urgent": return COLORS.emergency;
    case "High": return COLORS.warning;
    case "Medium": return COLORS.info;
    default: return COLORS.textMuted;
  }
};

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case "Urgent": return "🔴";
    case "High": return "🟠";
    case "Medium": return "🔵";
    default: return "⚪";
  }
};

export default function OrganizationAlertsFeedScreen() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [filter, setFilter] = useState<string>("All");

  const loadAlerts = async () => {
    setIsLoading(true);
    setErrorMessage("");

    let query = supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter !== "All") {
      query = query.eq("type", filter);
    }

    const { data, error } = await query;

    if (error) {
      setErrorMessage("Could not load alerts from Supabase.");
      setAlerts([]);
    } else {
      const dataWithRead = (data || []).map((item: any, index: number) => ({
        ...item,
        read: index < 2 ? false : true, // First 2 alerts are unread
      }));
      setAlerts(dataWithRead);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  const markAsRead = (id: string) => {
    setAlerts((current) =>
      current.map((alert) =>
        alert.id === id ? { ...alert, read: true } : alert
      )
    );
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      markAsRead(id);
    }
  };

  const unreadCount = alerts.filter((alert) => !alert.read).length;
  const filterOptions = ["All", "Emergency", "Resource", "Safety", "Update"];

  return (
    <Screen>
      <Stack.Screen options={{ title: "Alerts & Updates" }} />

      <SectionTitle
        title="Alerts & Resource Updates"
        subtitle="Recent announcements, resource updates, and last-updated information."
      />

      {/* Unread count with priority indicator */}
      <View style={styles.statsRow}>
        <Card accentColor={COLORS.warning} style={styles.statsCard}>
          <Text style={styles.statsNumber}>{unreadCount}</Text>
          <Text style={styles.statsLabel}>Unread alerts</Text>
        </Card>
        <Card accentColor={COLORS.primary} style={styles.statsCard}>
          <Text style={styles.statsNumber}>{alerts.length}</Text>
          <Text style={styles.statsLabel}>Total alerts</Text>
        </Card>
        <Card accentColor={COLORS.emergency} style={styles.statsCard}>
          <Text style={styles.statsNumber}>
            {alerts.filter(a => a.priority === "Urgent").length}
          </Text>
          <Text style={styles.statsLabel}>Urgent</Text>
        </Card>
      </View>

      {/* Filter buttons */}
      <View style={styles.filterRow}>
        {filterOptions.map((option) => (
          <Pressable
            key={option}
            onPress={() => setFilter(option)}
            style={[
              styles.filterTab,
              filter === option && styles.filterTabActive,
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === option && styles.filterTabTextActive,
              ]}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <Card>
          <Text style={styles.loadingText}>Loading alerts...</Text>
        </Card>
      ) : errorMessage ? (
        <Card accentColor={COLORS.emergency} style={styles.errorCard}>
          <Text style={styles.errorTitle}>Database error</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <AppButton title="Try Again" onPress={loadAlerts} variant="danger" />
        </Card>
      ) : alerts.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="No alerts"
          message="Organization alerts will appear here when they are published."
        />
      ) : (
        alerts.map((alert) => {
          const expanded = expandedId === alert.id;
          const isUnread = !alert.read;
          const priorityColor = getPriorityColor(alert.priority);
          const priorityIcon = getPriorityIcon(alert.priority);

          return (
            <Pressable
              key={alert.id}
              onPress={() => toggleExpand(alert.id)}
            >
              <Card
                accentColor={priorityColor}
                style={[
                  isUnread && styles.unreadAlert,
                  expanded && styles.expandedAlert,
                ]}
              >
                <View style={styles.headerRow}>
                  <View style={styles.titleWrap}>
                    <View style={styles.titleRow}>
                      <Text style={styles.title}>{alert.title}</Text>
                      {isUnread && (
                        <View style={[styles.unreadDot, { backgroundColor: priorityColor }]} />
                      )}
                      <Text style={[styles.priorityIcon, { color: priorityColor }]}>
                        {priorityIcon}
                      </Text>
                    </View>
                    <Text style={styles.updated}>Posted {formatDate(alert.created_at)}</Text>
                  </View>
                  <StatusBadge label={alert.priority} tone={
                    alert.priority === "Urgent" ? "urgent" :
                    alert.priority === "High" ? "high" :
                    alert.priority === "Medium" ? "medium" : "low"
                  } />
                </View>

                <View style={styles.badgeRow}>
                  <StatusBadge label={alert.type} />
                  <Text style={styles.area}>📍 {alert.area}</Text>
                  {alert.priority === "Urgent" && (
                    <Text style={styles.urgentLabel}>⚡ URGENT</Text>
                  )}
                </View>

                <Text style={styles.label}>Message</Text>
                <Text style={styles.value}>{alert.message}</Text>

                {expanded && (
                  <View style={styles.expandedContent}>
                    {alert.instructions ? (
                      <>
                        <View style={styles.divider} />
                        <Text style={styles.label}>Instructions</Text>
                        <Text style={styles.instructions}>{alert.instructions}</Text>
                      </>
                    ) : null}

                    <View style={styles.divider} />
                    <Text style={styles.label}>Last Updated</Text>
                    <Text style={styles.affectedArea}>
                      {formatDate(alert.created_at)}
                    </Text>
                  </View>
                )}

                <Text style={styles.expandHint}>
                  {expanded ? "Tap to collapse details" : "Tap for more details"}
                </Text>
              </Card>
            </Pressable>
          );
        })
      )}

      <AppButton title="Refresh Alerts" onPress={loadAlerts} variant="secondary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statsCard: {
    flex: 1,
    alignItems: "center",
    padding: SPACING.md,
  },
  statsNumber: {
    color: COLORS.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: "900",
  },
  statsLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  filterTab: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
  },
  filterTabTextActive: {
    color: COLORS.white,
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    flexWrap: "wrap",
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: RADIUS.round,
  },
  priorityIcon: {
    fontSize: FONT_SIZE.md,
  },
  updated: {
    color: COLORS.textMuted,
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
  area: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
  },
  urgentLabel: {
    color: COLORS.emergency,
    fontSize: FONT_SIZE.xs,
    fontWeight: "800",
  },
  label: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.xs,
    fontWeight: "800",
    textTransform: "uppercase",
    marginTop: SPACING.sm,
  },
  value: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    marginTop: 3,
  },
  expandedContent: {
    marginTop: SPACING.md,
  },
  divider: {
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    marginVertical: SPACING.md,
  },
  instructions: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    marginTop: 3,
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  affectedArea: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    marginTop: 3,
    fontWeight: "600",
  },
  expandHint: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.xs,
    textAlign: "center",
    marginTop: SPACING.md,
    fontStyle: "italic",
  },
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
  unreadAlert: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.emergency,
  },
  expandedAlert: {
    backgroundColor: COLORS.surfaceMuted,
  },
});