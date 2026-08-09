import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import FormInput from "../../components/FormInput";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";
import SelectOption from "../../components/SelectOption";
import StatusBadge from "../../components/StatusBadge";
import { COLORS, FONT_SIZE, ROLE_COLORS, SPACING } from "../../constants/theme";
import { useAppContext } from "../../context/AppContext";
import type { OrganizationStatusValue, ShelterResource } from "../../types";

type ShelterForm = {
  name: string;
  address: string;
  city: string;
  contactNumber: string;
  availableBeds: string;
  totalCapacity: string;
  foodSupport: string;
  waterSupport: string;
  medicalSupport: string;
  supplies: string;
  operatingHours: string;
  status: OrganizationStatusValue;
  isPublished: boolean;
  latitude: string;
  longitude: string;
};

const statuses: OrganizationStatusValue[] = ["Open", "Limited", "Full", "Closed"];

const blankForm: ShelterForm = {
  name: "",
  address: "",
  city: "Scarborough, ON",
  contactNumber: "",
  availableBeds: "0",
  totalCapacity: "0",
  foodSupport: "0",
  waterSupport: "0",
  medicalSupport: "",
  supplies: "",
  operatingHours: "24 hours",
  status: "Open",
  isPublished: true,
  latitude: "43.7856",
  longitude: "-79.2267",
};

const getFormFromShelter = (shelter: ShelterResource): ShelterForm => ({
  name: shelter.name,
  address: shelter.address,
  city: shelter.city,
  contactNumber: shelter.contactNumber,
  availableBeds: String(shelter.availableBeds),
  totalCapacity: String(shelter.totalCapacity),
  foodSupport: String(shelter.foodSupport),
  waterSupport: String(shelter.waterSupport),
  medicalSupport: shelter.medicalSupport,
  supplies: shelter.supplies,
  operatingHours: shelter.operatingHours,
  status: shelter.status,
  isPublished: shelter.isPublished,
  latitude: String(shelter.latitude),
  longitude: String(shelter.longitude),
});

const parseNonNegativeNumber = (value: string) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : null;
};

const formatDateTime = (isoDate: string) =>
  new Date(isoDate).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function ManageSheltersScreen() {
  const router = useRouter();
  const {
    shelters,
    publishedShelters,
    addShelter,
    updateShelter,
    deleteShelter,
    toggleShelterPublished,
  } = useAppContext();

  const [editingShelterId, setEditingShelterId] = useState<string | null>(null);
  const [form, setForm] = useState<ShelterForm>(blankForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmation, setConfirmation] = useState("");

  const editingShelter = useMemo(
    () => shelters.find((shelter) => shelter.id === editingShelterId) ?? null,
    [editingShelterId, shelters],
  );

  const updateField = <K extends keyof ShelterForm>(field: K, value: ShelterForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setConfirmation("");
  };

  const resetForm = () => {
    setEditingShelterId(null);
    setForm(blankForm);
    setErrors({});
    setConfirmation("");
  };

  const startEditing = (shelter: ShelterResource) => {
    setEditingShelterId(shelter.id);
    setForm(getFormFromShelter(shelter));
    setErrors({});
    setConfirmation(`Editing ${shelter.name}.`);
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    const availableBeds = parseNonNegativeNumber(form.availableBeds);
    const totalCapacity = parseNonNegativeNumber(form.totalCapacity);
    const foodSupport = parseNonNegativeNumber(form.foodSupport);
    const waterSupport = parseNonNegativeNumber(form.waterSupport);
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);

    if (!form.name.trim()) {
      nextErrors.name = "Enter the shelter name.";
    }

    if (!form.address.trim()) {
      nextErrors.address = "Enter the shelter address.";
    }

    if (!form.city.trim()) {
      nextErrors.city = "Enter the city or area.";
    }

    if (!form.contactNumber.trim()) {
      nextErrors.contactNumber = "Enter a contact number.";
    }

    if (availableBeds === null) {
      nextErrors.availableBeds = "Enter zero or a positive number.";
    }

    if (totalCapacity === null || (availableBeds !== null && totalCapacity < availableBeds)) {
      nextErrors.totalCapacity = "Capacity must be equal to or greater than available beds.";
    }

    if (foodSupport === null) {
      nextErrors.foodSupport = "Enter zero or a positive number.";
    }

    if (waterSupport === null) {
      nextErrors.waterSupport = "Enter zero or a positive number.";
    }

    if (!form.medicalSupport.trim()) {
      nextErrors.medicalSupport = "Enter medical support details or None.";
    }

    if (!form.supplies.trim()) {
      nextErrors.supplies = "Enter supplies details or None.";
    }

    if (!form.operatingHours.trim()) {
      nextErrors.operatingHours = "Enter operating hours.";
    }

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      nextErrors.latitude = "Enter a valid latitude between -90 and 90.";
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      nextErrors.longitude = "Enter a valid longitude between -180 and 180.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return null;
    }

    return {
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      contactNumber: form.contactNumber.trim(),
      availableBeds: availableBeds ?? 0,
      totalCapacity: totalCapacity ?? 0,
      foodSupport: foodSupport ?? 0,
      waterSupport: waterSupport ?? 0,
      medicalSupport: form.medicalSupport.trim(),
      supplies: form.supplies.trim(),
      operatingHours: form.operatingHours.trim(),
      status: form.status,
      isPublished: form.isPublished,
      latitude,
      longitude,
    };
  };

  const saveShelter = () => {
    const validatedShelter = validateForm();

    if (!validatedShelter) {
      return;
    }

    if (editingShelterId) {
      const updated = updateShelter(editingShelterId, validatedShelter);

      if (updated) {
        setConfirmation(`${validatedShelter.name} was updated successfully.`);
        setEditingShelterId(null);
        setForm(blankForm);
      } else {
        setConfirmation("Shelter could not be found for updating.");
      }

      return;
    }

    addShelter(validatedShelter);
    setConfirmation(`${validatedShelter.name} was added and saved.`);
    setForm(blankForm);
  };

  const confirmDelete = (shelter: ShelterResource) => {
    Alert.alert(
      "Delete shelter?",
      `This will remove ${shelter.name} from RescueBridge shelter availability.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteShelter(shelter.id);
            if (editingShelterId === shelter.id) {
              resetForm();
            }
            setConfirmation(`${shelter.name} was deleted.`);
          },
        },
      ],
    );
  };

  const togglePublish = (shelter: ShelterResource) => {
    const nextPublishedState = !shelter.isPublished;
    toggleShelterPublished(shelter.id, nextPublishedState);
    setConfirmation(
      `${shelter.name} is now ${nextPublishedState ? "published" : "unpublished"}.`,
    );
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: "Manage Shelters" }} />

      <SectionTitle
        title="Manage RescueBridge Shelters"
        subtitle="Add, update, publish, unpublish, or delete shelters that affected individuals can see during an emergency."
      />

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{shelters.length}</Text>
          <Text style={styles.summaryLabel}>Total shelters</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{publishedShelters.length}</Text>
          <Text style={styles.summaryLabel}>Visible to users</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {shelters.reduce((total, shelter) => total + shelter.availableBeds, 0)}
          </Text>
          <Text style={styles.summaryLabel}>Beds listed</Text>
        </Card>
      </View>

      <Card accentColor={ROLE_COLORS.organization.main} style={styles.formCard}>
        <Text style={styles.formTitle}>
          {editingShelter ? `Editing: ${editingShelter.name}` : "Add or update shelter"}
        </Text>

        <FormInput
          label="Shelter name"
          required
          placeholder="Example: Progress Emergency Shelter"
          value={form.name}
          onChangeText={(value) => updateField("name", value)}
          error={errors.name}
        />

        <FormInput
          label="Street address"
          required
          placeholder="Example: 45 Progress Avenue"
          value={form.address}
          onChangeText={(value) => updateField("address", value)}
          error={errors.address}
        />

        <FormInput
          label="City / Area"
          required
          placeholder="Example: Scarborough, ON"
          value={form.city}
          onChangeText={(value) => updateField("city", value)}
          error={errors.city}
        />

        <FormInput
          label="Contact number"
          required
          placeholder="Example: 416-555-0145"
          value={form.contactNumber}
          onChangeText={(value) => updateField("contactNumber", value)}
          keyboardType="phone-pad"
          error={errors.contactNumber}
        />

        <View style={styles.twoColumn}>
          <View style={styles.half}>
            <FormInput
              label="Available beds"
              required
              value={form.availableBeds}
              onChangeText={(value) => updateField("availableBeds", value)}
              keyboardType="numeric"
              error={errors.availableBeds}
            />
          </View>

          <View style={styles.half}>
            <FormInput
              label="Total capacity"
              required
              value={form.totalCapacity}
              onChangeText={(value) => updateField("totalCapacity", value)}
              keyboardType="numeric"
              error={errors.totalCapacity}
            />
          </View>
        </View>

        <View style={styles.twoColumn}>
          <View style={styles.half}>
            <FormInput
              label="Food units"
              required
              value={form.foodSupport}
              onChangeText={(value) => updateField("foodSupport", value)}
              keyboardType="numeric"
              error={errors.foodSupport}
            />
          </View>

          <View style={styles.half}>
            <FormInput
              label="Water units"
              required
              value={form.waterSupport}
              onChangeText={(value) => updateField("waterSupport", value)}
              keyboardType="numeric"
              error={errors.waterSupport}
            />
          </View>
        </View>

        <FormInput
          label="Medical support"
          required
          placeholder="Example: First-aid nurse available until 10 PM"
          value={form.medicalSupport}
          onChangeText={(value) => updateField("medicalSupport", value)}
          multiline
          error={errors.medicalSupport}
        />

        <FormInput
          label="Supplies"
          required
          placeholder="Example: Blankets, hygiene kits, winter clothing"
          value={form.supplies}
          onChangeText={(value) => updateField("supplies", value)}
          multiline
          error={errors.supplies}
        />

        <FormInput
          label="Operating hours"
          required
          placeholder="Example: 24 hours"
          value={form.operatingHours}
          onChangeText={(value) => updateField("operatingHours", value)}
          error={errors.operatingHours}
        />

        <Text style={styles.groupLabel}>Shelter status</Text>
        <View style={styles.statusGrid}>
          {statuses.map((status) => (
            <View key={status} style={styles.statusItem}>
              <SelectOption
                label={status}
                selected={form.status === status}
                onPress={() => updateField("status", status)}
              />
            </View>
          ))}
        </View>

        <Text style={styles.groupLabel}>Affected user visibility</Text>
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <SelectOption
              label="Published"
              description="Affected users can see this shelter if beds are available."
              selected={form.isPublished}
              onPress={() => updateField("isPublished", true)}
            />
          </View>

          <View style={styles.statusItem}>
            <SelectOption
              label="Draft / Hidden"
              description="Keep this shelter hidden from affected users."
              selected={!form.isPublished}
              onPress={() => updateField("isPublished", false)}
            />
          </View>
        </View>

        <View style={styles.twoColumn}>
          <View style={styles.half}>
            <FormInput
              label="Latitude"
              required
              value={form.latitude}
              onChangeText={(value) => updateField("latitude", value)}
              keyboardType="decimal-pad"
              error={errors.latitude}
            />
          </View>

          <View style={styles.half}>
            <FormInput
              label="Longitude"
              required
              value={form.longitude}
              onChangeText={(value) => updateField("longitude", value)}
              keyboardType="decimal-pad"
              error={errors.longitude}
            />
          </View>
        </View>

        {confirmation ? (
          <Card accentColor={COLORS.success} style={styles.confirmationCard}>
            <Text style={styles.confirmationText}>{confirmation}</Text>
          </Card>
        ) : null}

        <AppButton
          title={editingShelterId ? "Save Shelter Changes" : "Add Shelter"}
          onPress={saveShelter}
          variant="success"
        />

        {editingShelterId ? (
          <AppButton title="Cancel Editing" onPress={resetForm} variant="outline" />
        ) : null}
      </Card>

      <SectionTitle
        title="Current Shelter Records"
        subtitle="Only published shelters with available beds and Open/Limited status appear to affected individuals."
      />

      {shelters.length === 0 ? (
        <EmptyState
          icon="🏠"
          title="No shelters added"
          message="Add a shelter above so affected individuals can find it during an emergency."
        />
      ) : (
        shelters.map((shelter) => (
          <Card
            key={shelter.id}
            accentColor={shelter.isPublished ? COLORS.success : COLORS.disabled}
          >
            <View style={styles.shelterHeader}>
              <View style={styles.shelterTitleWrap}>
                <Text style={styles.shelterName}>{shelter.name}</Text>
                <Text style={styles.shelterAddress}>
                  {shelter.address}, {shelter.city}
                </Text>
              </View>

              <View style={styles.badges}>
                <StatusBadge label={shelter.status} />
                <StatusBadge label={shelter.isPublished ? "Published" : "Hidden"} />
              </View>
            </View>

            <View style={styles.detailGrid}>
              <View style={styles.detailBox}>
                <Text style={styles.detailLabel}>Available beds</Text>
                <Text style={styles.detailValue}>{shelter.availableBeds}</Text>
              </View>

              <View style={styles.detailBox}>
                <Text style={styles.detailLabel}>Capacity</Text>
                <Text style={styles.detailValue}>{shelter.totalCapacity}</Text>
              </View>

              <View style={styles.detailBox}>
                <Text style={styles.detailLabel}>Food</Text>
                <Text style={styles.detailValue}>{shelter.foodSupport}</Text>
              </View>

              <View style={styles.detailBox}>
                <Text style={styles.detailLabel}>Water</Text>
                <Text style={styles.detailValue}>{shelter.waterSupport}</Text>
              </View>
            </View>

            <Text style={styles.detailText}>Medical: {shelter.medicalSupport}</Text>
            <Text style={styles.detailText}>Supplies: {shelter.supplies}</Text>
            <Text style={styles.detailText}>Contact: {shelter.contactNumber}</Text>
            <Text style={styles.detailText}>Hours: {shelter.operatingHours}</Text>
            <Text style={styles.updatedText}>Updated: {formatDateTime(shelter.updatedAt)}</Text>

            <View style={styles.actionRow}>
              <AppButton
                title="Edit"
                onPress={() => startEditing(shelter)}
                variant="secondary"
                style={styles.actionButton}
              />

              <AppButton
                title={shelter.isPublished ? "Hide" : "Publish"}
                onPress={() => togglePublish(shelter)}
                variant="outline"
                style={styles.actionButton}
              />

              <AppButton
                title="Delete"
                onPress={() => confirmDelete(shelter)}
                variant="danger"
                style={styles.actionButton}
              />
            </View>
          </Card>
        ))
      )}

      <AppButton
        title="View Affected Shelter Screen"
        onPress={() => router.push("/affected/nearby-shelters" as any)}
        variant="secondary"
      />

      <AppButton
        title="Back to Organization Dashboard"
        onPress={() => router.push("/organization" as any)}
        variant="outline"
      />
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
    color: ROLE_COLORS.organization.main,
    fontSize: FONT_SIZE.xl,
    fontWeight: "900",
    textAlign: "center",
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    textAlign: "center",
    marginTop: 2,
  },
  formCard: {
    backgroundColor: ROLE_COLORS.organization.light,
  },
  formTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    marginBottom: SPACING.md,
  },
  twoColumn: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  half: {
    flex: 1,
  },
  groupLabel: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
    marginBottom: SPACING.sm,
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statusItem: {
    flex: 1,
    minWidth: 150,
  },
  confirmationCard: {
    backgroundColor: COLORS.successLight,
    marginBottom: SPACING.md,
  },
  confirmationText: {
    color: COLORS.success,
    fontSize: FONT_SIZE.sm,
    fontWeight: "800",
  },
  shelterHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  shelterTitleWrap: {
    flex: 1,
  },
  shelterName: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
  },
  shelterAddress: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 19,
    marginTop: 2,
  },
  badges: {
    alignItems: "flex-end",
    gap: SPACING.xs,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  detailBox: {
    flex: 1,
    minWidth: 120,
    backgroundColor: COLORS.surfaceMuted,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.md,
  },
  detailLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.xs,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  detailValue: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    marginTop: SPACING.xs,
  },
  detailText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    marginTop: SPACING.xs,
  },
  updatedText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.xs,
    fontWeight: "800",
    marginTop: SPACING.sm,
  },
  actionRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  actionButton: {
    flex: 1,
  },
});