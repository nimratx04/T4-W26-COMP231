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

export default function CommunityAlertsScreen() {
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
      setErrorMessage(`Could not load community alerts: ${error.message}`);
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
      <Stack.Screen options={{ title: "Community Alerts" }} />
      <SectionTitle title="Community Alerts" subtitle="Review the message, affected area, and safety instructions for current alerts." />

      {isLoading ? (
        <Card><Text style={styles.message}>Loading alerts...</Text></Card>
      ) : errorMessage ? (
        <Card accentColor={COLORS.emergency}>
          <Text style={styles.message}>{errorMessage}</Text>
          <AppButton title="Try Again" onPress={loadAlerts} variant="danger" />
        </Card>
      ) : alerts.length === 0 ? (
        <EmptyState icon="🔔" title="No alerts" message="Community alerts will appear here when an Admin publishes a broadcast." />
      ) : (
        alerts.map((alert) => {
          const expanded = expandedId === alert.id;
          return (
            <Card key={alert.id} accentColor={alert.priority === "Urgent" ? COLORS.emergency : ROLE_COLORS.reporter.main}>
              <View style={styles.headerRow}>
                <View style={styles.flex}>
                  <Text style={styles.title}>{alert.title}</Text>
                  <Text style={styles.date}>{new Date(alert.created_at).toLocaleString()}</Text>
                </View>
                <StatusBadge label={alert.priority} />
              </View>

              <Text style={styles.label}>Message</Text>
              <Text style={styles.value}>{alert.message}</Text>

              <Text style={styles.label}>Affected Area</Text>
              <Text style={styles.value}>{alert.area}</Text>

              {expanded ? (
                <>
                  <Text style={styles.label}>Instructions</Text>
                  <Text style={styles.value}>{alert.instructions || "No additional instructions."}</Text>
                </>
              ) : null}

              <AppButton title={expanded ? "Hide Instructions" : "View Instructions"} onPress={() => setExpandedId(expanded ? null : alert.id)} variant="secondary" />
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
  date: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },
  label: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, fontWeight: "800", textTransform: "uppercase", marginTop: SPACING.md },
  value: { color: COLORS.text, fontSize: FONT_SIZE.sm, lineHeight: 20, marginTop: 3 },
  message: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, lineHeight: 20 },
});
