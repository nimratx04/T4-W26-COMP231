import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";
import StatusBadge from "../../components/StatusBadge";
import { COLORS, FONT_SIZE, SPACING } from "../../constants/theme";
import { supabase } from "../../lib/supabase";

type VolunteerRow = {
  id: string;
  name: string;
  email: string | null;
  id_reference: string | null;
  police_check_reference: string | null;
  emergency_contact: string | null;
  safety_agreement: boolean;
  status: string;
  result_message: string | null;
  created_at: string;
};

export default function VerificationStatusScreen() {
  const router = useRouter();

  const [volunteer, setVolunteer] = useState<VolunteerRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadVerificationStatus = async () => {
    setIsLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("volunteers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      setErrorMessage("Could not load verification status from Supabase.");
      setVolunteer(null);
    } else {
      setVolunteer(data as VolunteerRow | null);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadVerificationStatus();
  }, []);

  const hasAccess = volunteer?.status === "Verified";

  return (
    <Screen>
      <Stack.Screen options={{ title: "Verification Status" }} />

      <SectionTitle
        title="Verification Status"
        subtitle="Verification information is loaded from the Supabase volunteers table."
      />

      {isLoading ? (
        <Card>
          <Text style={styles.loadingText}>Loading verification status...</Text>
        </Card>
      ) : errorMessage ? (
        <Card accentColor={COLORS.emergency} style={styles.errorCard}>
          <Text style={styles.errorTitle}>Database error</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <AppButton title="Try Again" onPress={loadVerificationStatus} variant="danger" />
        </Card>
      ) : !volunteer ? (
        <EmptyState
          icon="🪪"
          title="No verification submitted"
          message="Submit volunteer verification information first. Then your status will appear here."
          actionTitle="Submit Verification"
          onAction={() => router.push("/volunteer/verification-form" as any)}
        />
      ) : (
        <>
          <Card accentColor={hasAccess ? COLORS.success : COLORS.warning}>
            <Text style={styles.name}>{volunteer.name}</Text>

            <View style={styles.statusRow}>
              <StatusBadge label={volunteer.status} />
              <Text style={styles.result}>
                {volunteer.result_message || "Verification is waiting for admin review."}
              </Text>
            </View>

            <Detail label="Email" value={volunteer.email || "Not provided"} />
            <Detail label="ID information" value={volunteer.id_reference || "Not submitted"} />
            <Detail label="Police check" value={volunteer.police_check_reference || "Not submitted"} />
            <Detail label="Emergency contact" value={volunteer.emergency_contact || "Not submitted"} />
          </Card>

          <Card
            accentColor={hasAccess ? COLORS.success : COLORS.emergency}
            style={hasAccess ? styles.accessCard : styles.lockedCard}
          >
            <Text style={styles.accessTitle}>{hasAccess ? "Task access enabled" : "Task access locked"}</Text>

            <Text style={styles.accessText}>
              {hasAccess
                ? "You can now view, accept, and manage volunteer tasks."
                : "Only a Verified volunteer can accept tasks. Admin must approve this volunteer first."}
            </Text>

            <AppButton
              title={hasAccess ? "View Available Tasks" : "Update Verification Form"}
              onPress={() =>
                router.push(hasAccess ? ("/volunteer/available-tasks" as any) : ("/volunteer/verification-form" as any))
              }
              variant={hasAccess ? "success" : "secondary"}
            />
          </Card>

          <AppButton title="Refresh Status" onPress={loadVerificationStatus} variant="primary" />
        </>
      )}
    </Screen>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  name: {
    color: COLORS.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: "900",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginVertical: SPACING.md,
  },
  result: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  detail: {
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    paddingTop: SPACING.md,
    marginTop: SPACING.md,
  },
  detailLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.xs,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  detailValue: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.xs,
  },
  accessCard: {
    backgroundColor: COLORS.successLight,
  },
  lockedCard: {
    backgroundColor: COLORS.emergencyLight,
  },
  accessTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
  },
  accessText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    marginVertical: SPACING.sm,
  },
});