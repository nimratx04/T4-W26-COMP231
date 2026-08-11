import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";
import StatusBadge from "../../components/StatusBadge";
import { COLORS, FONT_SIZE, ROLE_COLORS, SPACING } from "../../constants/theme";
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
};

export default function OrganizationAlertsScreen() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
      setErrorMessage(`Could not load alerts: ${error.message}`);
    } else {
      setAlerts((data || []) as AlertRow[]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  return (
    <Screen>
      <Stack.Screen options={{ title: "Alerts & Updates" }} />
      <SectionTitle title="Alerts & Updates" subtitle="View recent emergency notices, affected areas, timestamps, and instructions." />

      {isLoading ? (
        <Card><Text style={styles.message}>Loading alerts...</Text></Card>
      ) : errorMessage ? (
        <Card accentColor={COLORS.emergency}><Text style={styles.message}>{errorMessage}</Text></Card>
      ) : alerts.length === 0 ? (
        <EmptyState icon="🔔" title="No alerts" message="Recent emergency broadcasts will appear here." />
      ) : (
        alerts.map((alert) => {
          const expanded = expandedId === alert.id;
          return (
            <Card key={alert.id} accentColor={alert.priority === "Urgent" ? COLORS.emergency : ROLE_COLORS.organization.main}>
              <View style={styles.headerRow}>
                <View style={styles.flex}>
                  <Text style={styles.title}>{alert.title}</Text>
                  <Text style={styles.meta}>{alert.type} • {new Date(alert.created_at).toLocaleString()}</Text>
                </View>
                <StatusBadge label={alert.priority} />
              </View>
              <Text style={styles.area}>📍 {alert.area}</Text>
              <Text style={styles.message}>{alert.message}</Text>
              {expanded ? (
                <View style={styles.details}>
                  <Text style={styles.label}>Instructions</Text>
                  <Text style={styles.message}>{alert.instructions || "No additional instructions."}</Text>
                </View>
              ) : null}
              <AppButton title={expanded ? "Hide Details" : "View Alert Details"} onPress={() => setExpandedId(expanded ? null : alert.id)} variant="secondary" />
            </Card>
          );
        })
      )}

      <AppButton title="Refresh Alerts" onPress={loadAlerts} variant="secondary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: SPACING.sm },
  flex: { flex: 1 },
  title: { color: COLORS.text, fontSize: FONT_SIZE.lg, fontWeight: "900" },
  meta: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },
  area: { color: ROLE_COLORS.organization.main, fontSize: FONT_SIZE.sm, fontWeight: "800", marginTop: SPACING.md },
  message: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, lineHeight: 20, marginTop: SPACING.sm },
  details: { borderTopColor: COLORS.border, borderTopWidth: 1, marginTop: SPACING.md, paddingTop: SPACING.md },
  label: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, fontWeight: "800", textTransform: "uppercase" },
});
