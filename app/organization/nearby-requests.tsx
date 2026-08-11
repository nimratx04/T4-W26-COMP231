import { Stack } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";
import SelectOption from "../../components/SelectOption";
import StatusBadge from "../../components/StatusBadge";
import { COLORS, FONT_SIZE, ROLE_COLORS, SPACING } from "../../constants/theme";
import { supabase } from "../../lib/supabase";

type RequestRow = {
  id: string;
  help_type: string;
  location: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
};

const filters = ["All", "Shelter", "Food", "Water", "Medical", "Transportation"] as const;
type Filter = (typeof filters)[number];

export default function NearbyRequestsScreen() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [filter, setFilter] = useState<Filter>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadRequests = async () => {
    setIsLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("help_requests")
      .select("id, help_type, location, description, priority, status, created_at")
      .neq("status", "Resolved")
      .order("created_at", { ascending: false });

    if (error) {
      setRequests([]);
      setErrorMessage(`Could not load nearby requests: ${error.message}`);
    } else {
      setRequests((data || []) as RequestRow[]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const visibleRequests = useMemo(
    () => requests.filter((request) => filter === "All" || request.help_type === filter),
    [filter, requests]
  );

  const openLocation = async (location: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
    await Linking.openURL(url);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: "Nearby Requests" }} />
      <SectionTitle
        title="Nearby Help Requests"
        subtitle="Filter active requests, identify urgent needs, inspect details, and open the saved location in Maps."
      />

      <View style={styles.filterWrap}>
        {filters.map((item) => (
          <SelectOption key={item} label={item} selected={filter === item} onPress={() => setFilter(item)} compact />
        ))}
      </View>

      {isLoading ? (
        <Card><Text style={styles.message}>Loading requests...</Text></Card>
      ) : errorMessage ? (
        <Card accentColor={COLORS.emergency}><Text style={styles.message}>{errorMessage}</Text></Card>
      ) : visibleRequests.length === 0 ? (
        <EmptyState icon="📍" title="No matching requests" message="There are no active requests matching the selected filter." />
      ) : (
        visibleRequests.map((request) => {
          const expanded = expandedId === request.id;
          const urgent = request.priority === "Urgent" || request.priority === "High";
          return (
            <Card key={request.id} accentColor={urgent ? COLORS.emergency : ROLE_COLORS.organization.main}>
              <View style={styles.headerRow}>
                <View style={styles.flex}>
                  <Text style={styles.title}>{request.help_type}</Text>
                  <Text style={styles.date}>{new Date(request.created_at).toLocaleString()}</Text>
                </View>
                <StatusBadge label={request.priority} />
              </View>
              <Text style={styles.location}>📍 {request.location}</Text>
              {expanded ? (
                <View style={styles.details}>
                  <Text style={styles.label}>Request details</Text>
                  <Text style={styles.message}>{request.description}</Text>
                  <Text style={styles.label}>Status</Text>
                  <StatusBadge label={request.status} />
                  <AppButton title="Open Location in Maps" onPress={() => openLocation(request.location)} variant="secondary" />
                </View>
              ) : null}
              <AppButton title={expanded ? "Hide Details" : "View Request Details"} onPress={() => setExpandedId(expanded ? null : request.id)} variant="secondary" />
            </Card>
          );
        })
      )}

      <AppButton title="Refresh Requests" onPress={loadRequests} variant="secondary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterWrap: { flexDirection: "row", flexWrap: "wrap", marginBottom: SPACING.md },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: SPACING.sm },
  flex: { flex: 1 },
  title: { color: COLORS.text, fontSize: FONT_SIZE.lg, fontWeight: "900" },
  date: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },
  location: { color: ROLE_COLORS.organization.main, fontSize: FONT_SIZE.sm, fontWeight: "800", marginTop: SPACING.md },
  details: { borderTopColor: COLORS.border, borderTopWidth: 1, marginTop: SPACING.md, paddingTop: SPACING.md },
  label: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, fontWeight: "800", textTransform: "uppercase", marginTop: SPACING.sm },
  message: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, lineHeight: 20, marginTop: SPACING.xs },
});
