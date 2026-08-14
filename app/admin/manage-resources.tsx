import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import FormInput from "../../components/FormInput";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";
import StatusBadge from "../../components/StatusBadge";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../constants/theme";
import { supabase } from "../../lib/supabase";

type ResourceRow = {
  id: string;
  organization_name: string;
  beds: number;
  food_available: string;
  water_available: string;
  blankets_supplies: string;
  medical_support: string;
  contact_number: string;
  operating_hours: string;
  status: string;
  type: string;
  updated_at: string;
};

export default function ManageResourcesScreen() {
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<ResourceRow>>({});
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error">("success");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadResources = async () => {
    setIsLoading(true);
    setErrorMessage("");
    setFeedback("");

    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      setErrorMessage("Could not load resources from Supabase.");
      setResources([]);
    } else {
      setResources(data || []);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadResources();
  }, []);

  const startEdit = (resource: ResourceRow) => {
    setEditingId(resource.id);
    setEditData(resource);
    setFeedback("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
    setFeedback("");
  };

  const saveEdit = async () => {
    if (!editingId) return;

    setFeedback("");

    // Validate required fields
    if (!editData.organization_name?.trim()) {
      setFeedbackType("error");
      setFeedback("Organization name is required.");
      return;
    }

    if (!editData.contact_number?.trim()) {
      setFeedbackType("error");
      setFeedback("Contact number is required.");
      return;
    }

    const { error } = await supabase
      .from("resources")
      .update({
        organization_name: editData.organization_name,
        beds: editData.beds || 0,
        food_available: editData.food_available || "0",
        water_available: editData.water_available || "0",
        blankets_supplies: editData.blankets_supplies || "",
        medical_support: editData.medical_support || "",
        contact_number: editData.contact_number,
        operating_hours: editData.operating_hours || "",
        status: editData.status || "Open",
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingId);

    if (error) {
      setFeedbackType("error");
      setFeedback("Resource could not be updated. Please try again.");
      return;
    }

    setResources((current) =>
      current.map((item) =>
        item.id === editingId
          ? {
              ...item,
              ...editData,
              updated_at: new Date().toISOString(),
            }
          : item
      )
    );

    setFeedbackType("success");
    setFeedback("Resource was updated successfully.");
    setEditingId(null);
    setEditData({});
  };

  const deleteResource = async (id: string) => {
    setFeedback("");

    const { error } = await supabase
      .from("resources")
      .delete()
      .eq("id", id);

    if (error) {
      setFeedbackType("error");
      setFeedback("Resource could not be deleted. Please try again.");
      return;
    }

    setResources((current) => current.filter((item) => item.id !== id));
    setFeedbackType("success");
    setFeedback("Resource was deleted successfully.");
  };

  const statusOptions = ["Open", "Limited", "Full", "Closed"];

  return (
    <Screen>
      <Stack.Screen options={{ title: "Manage Resources" }} />

      <SectionTitle
        title="Resources & Shelters"
        subtitle="View, edit, and manage resource availability. Changes are saved to Supabase."
      />

      {feedback ? (
        <Card
          accentColor={feedbackType === "error" ? COLORS.emergency : COLORS.success}
          style={feedbackType === "error" ? styles.errorCard : styles.feedbackCard}
        >
          <Text style={feedbackType === "error" ? styles.errorText : styles.feedbackText}>
            {feedback}
          </Text>
        </Card>
      ) : null}

      {isLoading ? (
        <Card>
          <Text style={styles.loadingText}>Loading resources...</Text>
        </Card>
      ) : errorMessage ? (
        <Card accentColor={COLORS.emergency} style={styles.errorCard}>
          <Text style={styles.errorTitle}>Database error</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <AppButton title="Try Again" onPress={loadResources} variant="danger" />
        </Card>
      ) : resources.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No resources"
          message="No resources have been created yet."
        />
      ) : (
        resources.map((resource) => {
          const isEditing = editingId === resource.id;

          return (
            <Card
              key={resource.id}
              accentColor={
                resource.status === "Open" 
                  ? COLORS.success 
                  : resource.status === "Limited" 
                  ? COLORS.warning 
                  : resource.status === "Full" 
                  ? COLORS.emergency 
                  : COLORS.textMuted
              }
            >
              {isEditing ? (
                <View>
                  <Text style={styles.editTitle}>Edit Resource</Text>
                  <FormInput
                    label="Organization name *"
                    value={editData.organization_name || ""}
                    onChangeText={(value) =>
                      setEditData((prev) => ({ ...prev, organization_name: value }))
                    }
                  />
                  <FormInput
                    label="Beds available"
                    keyboardType="number-pad"
                    value={String(editData.beds || 0)}
                    onChangeText={(value) =>
                      setEditData((prev) => ({ ...prev, beds: parseInt(value) || 0 }))
                    }
                  />
                  <FormInput
                    label="Food available"
                    value={editData.food_available || "0"}
                    onChangeText={(value) =>
                      setEditData((prev) => ({ ...prev, food_available: value }))
                    }
                  />
                  <FormInput
                    label="Water available"
                    value={editData.water_available || "0"}
                    onChangeText={(value) =>
                      setEditData((prev) => ({ ...prev, water_available: value }))
                    }
                  />
                  <Text style={styles.label}>Status</Text>
                  <View style={styles.statusRow}>
                    {statusOptions.map((status) => (
                      <Pressable
                        key={status}
                        onPress={() => setEditData((prev) => ({ ...prev, status }))}
                        style={[
                          styles.statusOption,
                          editData.status === status && styles.statusOptionActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusOptionText,
                            editData.status === status && styles.statusOptionTextActive,
                          ]}
                        >
                          {status}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <FormInput
                    label="Contact number *"
                    value={editData.contact_number || ""}
                    onChangeText={(value) =>
                      setEditData((prev) => ({ ...prev, contact_number: value }))
                    }
                  />
                  <FormInput
                    label="Operating hours"
                    value={editData.operating_hours || ""}
                    onChangeText={(value) =>
                      setEditData((prev) => ({ ...prev, operating_hours: value }))
                    }
                  />
                  <FormInput
                    label="Medical support"
                    value={editData.medical_support || ""}
                    onChangeText={(value) =>
                      setEditData((prev) => ({ ...prev, medical_support: value }))
                    }
                  />
                  <View style={styles.buttonRow}>
                    <AppButton
                      title="Cancel"
                      onPress={cancelEdit}
                      variant="outline"
                      style={styles.flex}
                    />
                    <AppButton
                      title="Save"
                      onPress={saveEdit}
                      variant="success"
                      style={styles.flex}
                    />
                  </View>
                </View>
              ) : (
                <View>
                  <View style={styles.headerRow}>
                    <View style={styles.titleWrap}>
                      <Text style={styles.title}>{resource.organization_name}</Text>
                      <Text style={styles.hours}>{resource.operating_hours || "Hours not set"}</Text>
                    </View>
                    <StatusBadge label={resource.status} />
                  </View>

                  <View style={styles.resourceGrid}>
                    <View style={styles.resourceItem}>
                      <Text style={styles.resourceLabel}>🛏️ Beds</Text>
                      <Text style={styles.resourceValue}>{resource.beds}</Text>
                    </View>
                    <View style={styles.resourceItem}>
                      <Text style={styles.resourceLabel}>🍽️ Food</Text>
                      <Text style={styles.resourceValue}>{resource.food_available}</Text>
                    </View>
                    <View style={styles.resourceItem}>
                      <Text style={styles.resourceLabel}>💧 Water</Text>
                      <Text style={styles.resourceValue}>{resource.water_available}</Text>
                    </View>
                  </View>

                  <View style={styles.resourceDetail}>
                    <Text style={styles.resourceLabel}>📞 Contact</Text>
                    <Text style={styles.resourceValue}>{resource.contact_number || "N/A"}</Text>
                  </View>

                  <View style={styles.resourceDetail}>
                    <Text style={styles.resourceLabel}>🏥 Medical</Text>
                    <Text style={styles.resourceValue}>{resource.medical_support || "Not specified"}</Text>
                  </View>

                  <View style={styles.resourceDetail}>
                    <Text style={styles.resourceLabel}>📦 Supplies</Text>
                    <Text style={styles.resourceValue}>{resource.blankets_supplies || "Not specified"}</Text>
                  </View>

                  <View style={styles.buttonRow}>
                    <AppButton
                      title="Edit"
                      onPress={() => startEdit(resource)}
                      variant="secondary"
                      style={styles.flex}
                    />
                    <AppButton
                      title="Delete"
                      onPress={() => deleteResource(resource.id)}
                      variant="danger"
                      style={styles.flex}
                    />
                  </View>
                </View>
              )}
            </Card>
          );
        })
      )}

      <AppButton title="Refresh Resources" onPress={loadResources} variant="secondary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  feedbackCard: {
    backgroundColor: COLORS.successLight,
  },
  feedbackText: {
    color: COLORS.success,
    fontSize: FONT_SIZE.sm,
    fontWeight: "800",
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
    color: COLORS.emergency,
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    lineHeight: 20,
    marginVertical: SPACING.sm,
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
  hours: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  resourceGrid: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  resourceItem: {
    flex: 1,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: "center",
  },
  resourceDetail: {
    marginTop: SPACING.md,
  },
  resourceLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
  },
  resourceValue: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  flex: {
    flex: 1,
  },
  editTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    marginBottom: SPACING.md,
  },
  label: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: "800",
    marginBottom: SPACING.sm,
  },
  statusRow: {
    flexDirection: "row",
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  statusOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  statusOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  statusOptionText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
  },
  statusOptionTextActive: {
    color: COLORS.white,
  },
});