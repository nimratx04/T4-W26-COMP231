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

type HelpRequestRow = {
  id: string;
  help_type: string;
  location: string;
  description: string;
  priority: string;
  status: string;
  assigned_volunteer_name: string | null;
  created_at: string;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const getPriorityEmoji = (priority: string) => {
  switch (priority) {
    case "Urgent": return "🔴";
    case "High": return "🟠";
    case "Medium": return "🟡";
    default: return "🟢";
  }
};

export default function NearbyRequestsScreen() {
  const [requests, setRequests] = useState<HelpRequestRow[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadRequests = async () => {
    setIsLoading(true);
    setErrorMessage("");

    let query = supabase
      .from("help_requests")
      .select("*")
      .order("priority", { ascending: false });

    if (filter !== "All") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;

    if (error) {
      setErrorMessage("Could not load requests from Supabase.");
      setRequests([]);
    } else {
      setRequests(data || []);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const filters = ["All", "Pending", "Active", "Resolved"];

  // Count requests by status for summary
  const pendingCount = requests.filter(r => r.status === "Pending").length;
  const activeCount = requests.filter(r => r.status === "Active").length;
  const resolvedCount = requests.filter(r => r.status === "Resolved").length;

  return (
    <Screen>
      <Stack.Screen options={{ title: "Nearby Requests" }} />

      <SectionTitle
        title="Nearby Help Requests"
        subtitle="View and filter requests in your area. Urgent requests are highlighted."
      />

      {/* Summary cards */}
      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={[styles.summaryNumber, { color: COLORS.warning }]}>{pendingCount}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={[styles.summaryNumber, { color: COLORS.primary }]}>{activeCount}</Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={[styles.summaryNumber, { color: COLORS.success }]}>{resolvedCount}</Text>
          <Text style={styles.summaryLabel}>Resolved</Text>
        </Card>
      </View>

      {/* Filter buttons */}
      <View style={styles.filterRow}>
        {filters.map((item) => (
          <Pressable
            key={item}
            onPress={() => setFilter(item)}
            style={[
              styles.filterTab,
              filter === item && styles.filterTabActive,
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === item && styles.filterTabTextActive,
              ]}
            >
              {item} ({requests.filter(r => filter === "All" || r.status === item).length})
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <Card>
          <Text style={styles.loadingText}>Loading requests...</Text>
        </Card>
      ) : errorMessage ? (
        <Card accentColor={COLORS.emergency} style={styles.errorCard}>
          <Text style={styles.errorTitle}>Database error</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <AppButton title="Try Again" onPress={loadRequests} variant="danger" />
        </Card>
      ) : requests.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No requests found"
          message="No help requests match your current filter."
        />
      ) : (
        requests.map((request) => {
          const expanded = expandedId === request.id;
          const isUrgent = request.priority === "Urgent";

          return (
            <Pressable
              key={request.id}
              onPress={() => setExpandedId(expanded ? null : request.id)}
            >
              <Card
                accentColor={
                  isUrgent
                    ? COLORS.emergency
                    : request.status === "Resolved"
                    ? COLORS.success
                    : COLORS.primary
                }
                style={isUrgent && styles.urgentCard}
              >
                <View style={styles.headerRow}>
                  <View style={styles.titleWrap}>
                    <View style={styles.titleRow}>
                      <Text style={styles.priorityEmoji}>
                        {getPriorityEmoji(request.priority)}
                      </Text>
                      <Text style={styles.title}>{request.help_type} Request</Text>
                    </View>
                    <Text style={styles.updated}>Created {formatDate(request.created_at)}</Text>
                  </View>

                  <View style={styles.badges}>
                    <StatusBadge 
                      label={request.priority} 
                      tone={
                        request.priority === "Urgent" ? "urgent" :
                        request.priority === "High" ? "high" :
                        request.priority === "Medium" ? "medium" : "low"
                      } 
                    />
                    <StatusBadge label={request.status} />
                  </View>
                </View>

                <Text style={styles.label}>Location</Text>
                <Text style={styles.value}>{request.location}</Text>

                {expanded && (
                  <View style={styles.expandedContent}>
                    <Text style={styles.label}>Description</Text>
                    <Text style={styles.value}>{request.description}</Text>

                    <View style={styles.divider} />

                    {request.assigned_volunteer_name ? (
                      <View style={styles.assignedRow}>
                        <Text style={styles.assignedIcon}>👤</Text>
                        <Text style={styles.assignedText}>
                          Assigned to: {request.assigned_volunteer_name}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.assignedRow}>
                        <Text style={styles.assignedIcon}>⏳</Text>
                        <Text style={styles.assignedTextWaiting}>
                          Waiting for volunteer assignment
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                <Text style={styles.expandHint}>
                  {expanded ? "Tap to collapse" : "Tap for more details"}
                </Text>
              </Card>
            </Pressable>
          );
        })
      )}

      <AppButton title="Refresh Requests" onPress={loadRequests} variant="secondary" />
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
    fontSize: FONT_SIZE.xl,
    fontWeight: "900",
  },
  summaryLabel: {
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
  },
  priorityEmoji: {
    fontSize: FONT_SIZE.md,
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
  badges: {
    alignItems: "flex-end",
    gap: SPACING.xs,
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
  assignedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  assignedIcon: {
    fontSize: FONT_SIZE.md,
  },
  assignedText: {
    color: COLORS.success,
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
  },
  assignedTextWaiting: {
    color: COLORS.warning,
    fontSize: FONT_SIZE.sm,
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
  urgentCard: {
    backgroundColor: COLORS.emergencyLight,
    borderLeftWidth: 6,
  },
});