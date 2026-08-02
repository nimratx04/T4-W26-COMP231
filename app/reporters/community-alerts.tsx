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
  incident_type: string;
  description: string;
  location: string;
  urgency: string;
  status: string;
  created_at: string;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export default function CommunityAlertsScreen() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadAlerts = async () => {
    setIsLoading(true);
    setErrorMessage("");

    // ✅ FIXED: Changed from "alerts" to "reporters"
    const { data, error } = await supabase
      .from("reporters")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage("Could not load community alerts from Supabase.");
      setAlerts([]);
    } else {
      setAlerts(data || []);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: "Community Alerts" }} />

      <SectionTitle
        title="Community Alerts"
        subtitle="Safety notices, incident updates, affected areas, and instructions."
      />

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
          message="Community alerts will appear here when they are published."
        />
      ) : (
        alerts.map((alert) => {
          const expanded = expandedId === alert.id;

          return (
            <Pressable
              key={alert.id}
              onPress={() => toggleExpand(alert.id)}
            >
              <Card
                accentColor={
                  alert.urgency === "Urgent"
                    ? COLORS.emergency
                    : alert.urgency === "High"
                    ? COLORS.warning
                    : COLORS.primary
                }
                style={expanded && styles.expandedAlert}
              >
                <View style={styles.headerRow}>
                  <View style={styles.titleWrap}>
                    <Text style={styles.title}>{alert.incident_type}</Text>
                    <Text style={styles.updated}>Posted {formatDate(alert.created_at)}</Text>
                  </View>
                  <StatusBadge label={alert.urgency} />
                </View>

                <View style={styles.badgeRow}>
                  <StatusBadge label={alert.status} />
                  <Text style={styles.area}>📍 {alert.location}</Text>
                </View>

                {/* Always show message */}
                <Text style={styles.label}>Message</Text>
                <Text style={styles.value}>{alert.description}</Text>

                {/* Expanded view shows instructions and affected areas */}
                {expanded && (
                  <View style={styles.expandedContent}>
                    <View style={styles.divider} />
                    <Text style={styles.label}>Affected Area</Text>
                    <Text style={styles.affectedArea}>{alert.location}</Text>

                    {alert.urgency === "Urgent" && (
                      <Card accentColor={COLORS.emergency} style={styles.urgentCard}>
                        <Text style={styles.urgentText}>
                          ⚠️ This is an urgent alert. Please take immediate action.
                        </Text>
                      </Card>
                    )}
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
  },
  area: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
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
  affectedArea: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    marginTop: 3,
    fontWeight: "600",
  },
  urgentCard: {
    backgroundColor: COLORS.emergencyLight,
    marginTop: SPACING.md,
  },
  urgentText: {
    color: COLORS.emergencyDark,
    fontSize: FONT_SIZE.sm,
    fontWeight: "800",
    textAlign: "center",
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
  expandedAlert: {
    backgroundColor: COLORS.surfaceMuted,
  },
});