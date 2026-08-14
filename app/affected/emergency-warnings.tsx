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

type WarningRow = {
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

export default function EmergencyWarningsScreen() {
  const [warnings, setWarnings] = useState<WarningRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadWarnings = async () => {
    setIsLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .in("type", ["Emergency", "Safety"])
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage("Could not load warnings from Supabase.");
      setWarnings([]);
    } else {
      // Mark some as unread for demo
      const dataWithRead = (data || []).map((item: any, index: number) => ({
        ...item,
        read: index < 2 ? false : true,
      }));
      setWarnings(dataWithRead);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadWarnings();
  }, []);

  const markAsRead = (id: string) => {
    setWarnings((current) =>
      current.map((warning) =>
        warning.id === id ? { ...warning, read: true } : warning
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

  const unreadCount = warnings.filter((warning) => !warning.read).length;

  return (
    <Screen>
      <Stack.Screen options={{ title: "Emergency Warnings" }} />

      <SectionTitle
        title="Emergency Warnings & Updates"
        subtitle="Current risks and changing conditions are loaded from Supabase."
      />

      {/* Unread count indicator */}
      {unreadCount > 0 && (
        <Card accentColor={COLORS.emergency} style={styles.unreadCard}>
          <Text style={styles.unreadText}>
            🔔 {unreadCount} new warning{unreadCount > 1 ? "s" : ""} available
          </Text>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <Text style={styles.loadingText}>Loading warnings...</Text>
        </Card>
      ) : errorMessage ? (
        <Card accentColor={COLORS.emergency} style={styles.errorCard}>
          <Text style={styles.errorTitle}>Database error</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <AppButton title="Try Again" onPress={loadWarnings} variant="danger" />
        </Card>
      ) : warnings.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="No warnings"
          message="Emergency warnings will appear here when they are published."
        />
      ) : (
        warnings.map((warning) => {
          const expanded = expandedId === warning.id;
          const isUnread = !warning.read;

          return (
            <Pressable
              key={warning.id}
              onPress={() => toggleExpand(warning.id)}
            >
              <Card
                accentColor={
                  warning.priority === "Urgent"
                    ? COLORS.emergency
                    : warning.priority === "High"
                    ? COLORS.warning
                    : COLORS.primary
                }
                style={[
                  isUnread && styles.unreadWarning,
                  expanded && styles.expandedWarning,
                ]}
              >
                <View style={styles.headerRow}>
                  <View style={styles.titleWrap}>
                    <View style={styles.titleRow}>
                      <Text style={styles.title}>{warning.title}</Text>
                      {isUnread && (
                        <View style={[styles.unreadDot, { backgroundColor: COLORS.emergency }]} />
                      )}
                    </View>
                    <Text style={styles.updated}>Posted {formatDate(warning.created_at)}</Text>
                  </View>
                  <StatusBadge label={warning.priority} />
                </View>

                <View style={styles.badgeRow}>
                  <StatusBadge label={warning.type} />
                  <Text style={styles.area}>📍 {warning.area}</Text>
                  {warning.priority === "Urgent" && (
                    <Text style={styles.urgentLabel}>⚠️ URGENT</Text>
                  )}
                </View>

                <Text style={styles.label}>Message</Text>
                <Text style={styles.value}>{warning.message}</Text>

                {expanded && warning.instructions ? (
                  <View style={styles.expandedContent}>
                    <View style={styles.divider} />
                    <Text style={styles.label}>Instructions</Text>
                    <Text style={styles.instructions}>{warning.instructions}</Text>
                  </View>
                ) : null}

                <Text style={styles.expandHint}>
                  {expanded ? "Tap to collapse" : "Tap for instructions"}
                </Text>
              </Card>
            </Pressable>
          );
        })
      )}

      <AppButton title="Refresh Warnings" onPress={loadWarnings} variant="secondary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  unreadCard: {
    backgroundColor: COLORS.emergencyLight,
  },
  unreadText: {
    color: COLORS.emergencyDark,
    fontSize: FONT_SIZE.sm,
    fontWeight: "800",
    textAlign: "center",
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
    gap: SPACING.sm,
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
  unreadWarning: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.emergency,
  },
  expandedWarning: {
    backgroundColor: COLORS.surfaceMuted,
  },
});