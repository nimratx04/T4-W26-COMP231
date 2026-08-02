import { Stack, useRouter } from "expo-router";
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

type IncidentStatus =
  | "Pending Verification"
  | "Verified"
  | "Responding"
  | "Resolved"
  | "Rejected";

type IncidentRow = {
  id: string;
  incident_type: string;
  description: string;
  location: string;
  urgency: string;
  photo_name: string | null;
  status: IncidentStatus;
  created_at: string;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const statusFilterOptions = [
  "All",
  "Pending Verification",
  "Verified",
  "Responding",
  "Resolved",
  "Rejected",
] as const;

export default function MyReportsScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<IncidentRow[]>([]);
  const [filteredReports, setFilteredReports] = useState<IncidentRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<typeof statusFilterOptions[number]>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadReports = async () => {
    setIsLoading(true);
    setErrorMessage("");

    // ✅ FIXED: Changed from "incident_reports" to "reporters"
    const { data, error } = await supabase
      .from("reporters")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage("Could not load incident reports from Supabase.");
      setReports([]);
      setFilteredReports([]);
    } else {
      const dataList = data || [];
      setReports(dataList);
      
      if (statusFilter === "All") {
        setFilteredReports(dataList);
      } else {
        setFilteredReports(dataList.filter((item) => item.status === statusFilter));
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    if (statusFilter === "All") {
      setFilteredReports(reports);
    } else {
      setFilteredReports(reports.filter((item) => item.status === statusFilter));
    }
  }, [statusFilter, reports]);

  const getStatusCount = (status: string) => {
    if (status === "All") return reports.length;
    return reports.filter((item) => item.status === status).length;
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: "My Reports" }} />

      <SectionTitle
        title="My Reports"
        subtitle="Track whether reports are pending verification, verified, responding, resolved, or rejected."
      />

      <View style={styles.filterRow}>
        {statusFilterOptions.map((option) => (
          <Pressable
            key={option}
            onPress={() => setStatusFilter(option)}
            style={[
              styles.filterTab,
              statusFilter === option && styles.filterTabActive,
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                statusFilter === option && styles.filterTabTextActive,
              ]}
            >
              {option === "All" ? "All" : option}
            </Text>
            <Text
              style={[
                styles.filterTabCount,
                statusFilter === option && styles.filterTabCountActive,
              ]}
            >
              {getStatusCount(option)}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <Card>
          <Text style={styles.loadingText}>Loading reports...</Text>
        </Card>
      ) : errorMessage ? (
        <Card accentColor={COLORS.emergency} style={styles.errorCard}>
          <Text style={styles.errorTitle}>Database error</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <AppButton title="Try Again" onPress={loadReports} variant="danger" />
        </Card>
      ) : filteredReports.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No reports found"
          message={
            statusFilter === "All"
              ? "When you submit an incident report, it will appear here from Supabase."
              : `No reports with status "${statusFilter}".`
          }
          actionTitle="Report Incident"
          onAction={() => router.push("/reporters/report-incident" as any)}
        />
      ) : (
        filteredReports.map((report) => (
          <Card
            key={report.id}
            accentColor={
              report.urgency === "Urgent"
                ? COLORS.emergency
                : report.status === "Pending Verification"
                ? COLORS.warning
                : report.status === "Resolved"
                ? COLORS.success
                : COLORS.primary
            }
          >
            <View style={styles.headerRow}>
              <View style={styles.titleWrap}>
                <Text style={styles.title}>{report.incident_type}</Text>
                <Text style={styles.updated}>Created {formatDate(report.created_at)}</Text>
              </View>
              <StatusBadge label={report.status} />
            </View>

            <View style={styles.badgeRow}>
              <StatusBadge label={report.urgency} />
              {report.photo_name ? (
                <Text style={styles.photo}>📷 Photo attached</Text>
              ) : (
                <Text style={styles.photo}>No photo</Text>
              )}
            </View>

            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>{report.location}</Text>

            <Text style={styles.label}>Description</Text>
            <Text style={styles.value}>{report.description}</Text>

            <Card accentColor={COLORS.primary} style={styles.statusCard}>
              <Text style={styles.statusCardText}>
                <Text style={styles.statusCardLabel}>Status: </Text>
                {report.status === "Pending Verification" && "Your report is waiting for admin review."}
                {report.status === "Verified" && "Your report has been verified and is being assessed."}
                {report.status === "Responding" && "A response is being coordinated for your report."}
                {report.status === "Resolved" && "This incident has been resolved."}
                {report.status === "Rejected" && "Your report was not verified. Please contact support if you have questions."}
              </Text>
            </Card>
          </Card>
        ))
      )}

      <AppButton
        title="Submit Another Report"
        onPress={() => router.push("/reporters/report-incident" as any)}
        variant="secondary"
      />

      <AppButton title="Refresh Reports" onPress={loadReports} variant="primary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
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
  filterTabCount: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: SPACING.xs,
    borderRadius: RADIUS.sm,
    minWidth: 20,
    textAlign: "center",
  },
  filterTabCountActive: {
    color: COLORS.white,
    backgroundColor: "rgba(255,255,255,0.3)",
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
  photo: {
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
  statusCard: {
    backgroundColor: COLORS.primaryLight,
    marginTop: SPACING.md,
    padding: SPACING.sm,
  },
  statusCardText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  statusCardLabel: {
    fontWeight: "800",
    color: COLORS.text,
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
});