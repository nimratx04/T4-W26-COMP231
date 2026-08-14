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

type IncidentRow = {
    id: string;
    incident_type: string;
    description: string;
    location: string;
    urgency: string;
    status: string;
    created_at: string;
};

function formatDate(value: string) {
    return new Date(value).toLocaleString();
}

export default function AdminIncidentReportsScreen() {
    const [reports, setReports] = useState<IncidentRow[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const loadReports = async () => {
        setIsLoading(true);
        setErrorMessage("");

        const { data, error } = await supabase
            .from("reporters")
            .select("id, incident_type, description, location, urgency, status, created_at")
            .order("created_at", { ascending: false });

        if (error) {
            setReports([]);
            setErrorMessage("Could not load incident reports from Supabase.");
        } else {
            setReports((data || []) as IncidentRow[]);
        }

        setIsLoading(false);
    };

    useEffect(() => {
        loadReports();
    }, []);

    const updateStatus = async (id: string, nextStatus: string) => {
        setMessage("");
        setErrorMessage("");

        try {
            const { data, error } = await supabase
                .from("reporters")
                .update({
                    status: nextStatus,
                })
                .eq("id", id)
                .select("id, status");

            console.log("Status update result:", {
                id,
                nextStatus,
                data,
                error,
            });

            if (error) {
                console.error("Supabase update error:", error);

                setMessage(
                    `Could not update incident status: ${error.message}`
                );

                return;
            }

            // If Supabase returned no row, the database was NOT actually updated.
            if (!data || data.length === 0) {
                setMessage(
                    "No database row was updated. Check the Supabase UPDATE/RLS policy for the reporters table."
                );

                return;
            }

            // Update the UI only AFTER Supabase confirms the update.
            setReports((current) =>
                current.map((item) =>
                    item.id === id
                        ? {
                            ...item,
                            status: data[0].status,
                        }
                        : item
                )
            );

            setMessage(
                `Incident status updated to ${data[0].status}.`
            );
        } catch (err) {
            console.error("Unexpected update error:", err);

            setMessage(
                "An unexpected error occurred while updating the incident status."
            );
        }
    };

    return (
        <Screen>
            <Stack.Screen options={{ title: "Incident Reports" }} />

            <SectionTitle
                title="Review & Manage Incident Reports"
                subtitle="Inspect incident type, location, urgency, and details before verifying, rejecting, or updating a report."
            />

            {message ? (
                <Card accentColor={message.includes("could not") ? COLORS.emergency : COLORS.success}>
                    <Text style={styles.message}>{message}</Text>
                </Card>
            ) : null}

            {isLoading ? (
                <Card>
                    <Text style={styles.loadingText}>Loading incident reports...</Text>
                </Card>
            ) : errorMessage ? (
                <Card accentColor={COLORS.emergency} style={styles.errorCard}>
                    <Text style={styles.errorTitle}>Database error</Text>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                    <AppButton title="Try Again" onPress={loadReports} variant="danger" />
                </Card>
            ) : reports.length === 0 ? (
                <EmptyState
                    icon="🚨"
                    title="No incident reports"
                    message="Community incident reports will appear here for coordinator review."
                />
            ) : (
                reports.map((report) => {
                    const expanded = expandedId === report.id;

                    return (
                        <Card key={report.id} accentColor={ROLE_COLORS.admin.main}>
                            <View style={styles.headerRow}>
                                <View style={styles.titleWrap}>
                                    <Text style={styles.title}>{report.incident_type}</Text>
                                    <Text style={styles.date}>Reported {formatDate(report.created_at)}</Text>
                                </View>
                                <StatusBadge label={report.urgency} />
                            </View>

                            <View style={styles.statusRow}>
                                <StatusBadge label={report.status} />
                                <Text style={styles.location}>📍 {report.location}</Text>
                            </View>

                            {expanded ? (
                                <View style={styles.detailBlock}>
                                    <Text style={styles.label}>Description</Text>
                                    <Text style={styles.value}>{report.description}</Text>

                                    <Text style={styles.label}>Incident status</Text>
                                    <Text style={styles.value}>{report.status}</Text>

                                    <View style={styles.actions}>
                                        <View style={styles.actionCell}>
                                            <AppButton title="Verify" onPress={() => updateStatus(report.id, "Verified")} variant="success" />
                                        </View>
                                        <View style={styles.actionCell}>
                                            <AppButton title="Reject" onPress={() => updateStatus(report.id, "Rejected")} variant="danger" />
                                        </View>
                                    </View>

                                    <View style={styles.actions}>
                                        <View style={styles.actionCell}>
                                            <AppButton title="Responding" onPress={() => updateStatus(report.id, "Responding")} variant="secondary" />
                                        </View>
                                        <View style={styles.actionCell}>
                                            <AppButton title="Resolve" onPress={() => updateStatus(report.id, "Resolved")} variant="secondary" />
                                        </View>
                                    </View>
                                </View>
                            ) : null}

                            <AppButton
                                title={expanded ? "Hide Details" : "Inspect Report"}
                                onPress={() => setExpandedId(expanded ? null : report.id)}
                                variant="secondary"
                            />
                        </Card>
                    );
                })
            )}

            {!isLoading && !errorMessage ? (
                <AppButton title="Refresh Reports" onPress={loadReports} variant="secondary" />
            ) : null}
        </Screen>
    );
}

const styles = StyleSheet.create({
    loadingText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
    errorCard: { backgroundColor: COLORS.emergencyLight },
    errorTitle: { color: COLORS.emergencyDark, fontWeight: "900", fontSize: FONT_SIZE.lg },
    errorText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, marginVertical: SPACING.sm },
    message: { color: COLORS.text, fontSize: FONT_SIZE.sm, fontWeight: "700" },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: SPACING.sm,
    },
    titleWrap: { flex: 1 },
    title: { color: COLORS.text, fontSize: FONT_SIZE.lg, fontWeight: "900" },
    date: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },
    statusRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginVertical: SPACING.md },
    location: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, flex: 1 },
    detailBlock: { marginBottom: SPACING.md },
    label: {
        color: COLORS.textMuted,
        fontSize: FONT_SIZE.xs,
        fontWeight: "800",
        textTransform: "uppercase",
        marginTop: SPACING.sm,
    },
    value: { color: COLORS.text, fontSize: FONT_SIZE.sm, lineHeight: 20, marginTop: 3 },
    actions: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md },
    actionCell: { flex: 1 },
});
