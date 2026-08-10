import { Stack, useRouter } from "expo-router";
import * as Location from "expo-location";
import { useMemo, useState } from "react";
import { Alert, Platform, StyleSheet, Text, View } from "react-native";
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
import type {
  EmergencyResource,
  EmergencyResourceCategory,
  OrganizationStatusValue,
} from "../../types";

type ResourceForm = {
  name: string;
  category: EmergencyResourceCategory;
  address: string;
  city: string;
  contactNumber: string;
  quantity: string;
  unit: string;
  availabilityNote: string;
  operatingHours: string;
  status: OrganizationStatusValue;
  isPublished: boolean;
  latitude: string;
  longitude: string;
};

type CoordinateResult = {
  latitude: number;
  longitude: number;
  source: string;
  query: string;
};

type NominatimResult = {
  lat?: string;
  lon?: string;
  display_name?: string;
};

const categories: EmergencyResourceCategory[] = ["Food", "Water", "Medical"];
const statuses: OrganizationStatusValue[] = ["Open", "Limited", "Full", "Closed"];

const blankForm: ResourceForm = {
  name: "",
  category: "Food",
  address: "",
  city: "Scarborough, ON",
  contactNumber: "",
  quantity: "0",
  unit: "items",
  availabilityNote: "",
  operatingHours: "24 hours",
  status: "Open",
  isPublished: true,
  latitude: "43.7856",
  longitude: "-79.2267",
};

const getFormFromResource = (resource: EmergencyResource): ResourceForm => ({
  name: resource.name,
  category: resource.category,
  address: resource.address,
  city: resource.city,
  contactNumber: resource.contactNumber,
  quantity: String(resource.quantity),
  unit: resource.unit,
  availabilityNote: resource.availabilityNote,
  operatingHours: resource.operatingHours,
  status: resource.status,
  isPublished: resource.isPublished,
  latitude: String(resource.latitude),
  longitude: String(resource.longitude),
});

const getCategoryIcon = (category: EmergencyResourceCategory) => {
  switch (category) {
    case "Food":
      return "🍽️";
    case "Water":
      return "💧";
    case "Medical":
      return "🏥";
    default:
      return "📦";
  }
};

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

const buildAddressQueries = (address: string, city: string) => {
  const cleanAddress = address.trim();
  const cleanCity = city.trim();

  return Array.from(
    new Set([
      `${cleanAddress}, ${cleanCity}, Canada`,
      `${cleanAddress}, ${cleanCity}`,
      `${cleanAddress}, Ontario, Canada`,
      `${cleanAddress}, Toronto, Ontario, Canada`,
      `${cleanAddress}, Scarborough, Ontario, Canada`,
    ]),
  );
};

const findCoordinatesForAddress = async (
  address: string,
  city: string,
): Promise<CoordinateResult | null> => {
  const queries = buildAddressQueries(address, city);

  for (const query of queries) {
    try {
      const results = await Location.geocodeAsync(query);
      const firstResult = results[0];

      if (firstResult) {
        return {
          latitude: firstResult.latitude,
          longitude: firstResult.longitude,
          source: "Expo",
          query,
        };
      }
    } catch {
      // Try the next method.
    }
  }

  for (const query of queries) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ca&q=${encodeURIComponent(
        query,
      )}`;

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        continue;
      }

      const data = (await response.json()) as NominatimResult[];
      const firstResult = data[0];

      const latitude = Number(firstResult?.lat);
      const longitude = Number(firstResult?.lon);

      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        return {
          latitude,
          longitude,
          source: "OpenStreetMap",
          query: firstResult?.display_name ?? query,
        };
      }
    } catch {
      // Try the next query.
    }
  }

  return null;
};

export default function ManageResourcesScreen() {
  const router = useRouter();
  const {
    emergencyResources,
    publishedEmergencyResources,
    addEmergencyResource,
    updateEmergencyResource,
    deleteEmergencyResource,
    toggleEmergencyResourcePublished,
  } = useAppContext();

  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [form, setForm] = useState<ResourceForm>(blankForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmation, setConfirmation] = useState("");
  const [isFindingCoordinates, setIsFindingCoordinates] = useState(false);

  const editingResource = useMemo(
    () => emergencyResources.find((resource) => resource.id === editingResourceId) ?? null,
    [editingResourceId, emergencyResources],
  );

  const updateField = <K extends keyof ResourceForm>(field: K, value: ResourceForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setConfirmation("");
  };

  const resetForm = () => {
    setEditingResourceId(null);
    setForm(blankForm);
    setErrors({});
    setConfirmation("");
  };

  const startEditing = (resource: EmergencyResource) => {
    setEditingResourceId(resource.id);
    setForm(getFormFromResource(resource));
    setErrors({});
    setConfirmation(`Editing ${resource.name}.`);
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    const quantity = parseNonNegativeNumber(form.quantity);
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);

    if (!form.name.trim()) nextErrors.name = "Enter the resource name.";
    if (!form.address.trim()) nextErrors.address = "Enter the resource address.";
    if (!form.city.trim()) nextErrors.city = "Enter the city or area.";
    if (!form.contactNumber.trim()) nextErrors.contactNumber = "Enter a contact number.";
    if (quantity === null) nextErrors.quantity = "Enter zero or a positive number.";

    if (!form.unit.trim()) {
      nextErrors.unit = "Enter the unit, for example bottles, meal kits, or care slots.";
    }

    if (!form.availabilityNote.trim()) nextErrors.availabilityNote = "Enter availability details.";
    if (!form.operatingHours.trim()) nextErrors.operatingHours = "Enter operating hours.";

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      nextErrors.latitude = "Enter a valid latitude between -90 and 90.";
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      nextErrors.longitude = "Enter a valid longitude between -180 and 180.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return null;

    return {
      name: form.name.trim(),
      category: form.category,
      address: form.address.trim(),
      city: form.city.trim(),
      contactNumber: form.contactNumber.trim(),
      quantity: quantity ?? 0,
      unit: form.unit.trim(),
      availabilityNote: form.availabilityNote.trim(),
      operatingHours: form.operatingHours.trim(),
      status: form.status,
      isPublished: form.isPublished,
      latitude,
      longitude,
    };
  };

  const fillCoordinatesFromAddress = async () => {
    const address = form.address.trim();
    const city = form.city.trim();

    if (!address || !city) {
      setErrors((current) => ({
        ...current,
        ...(address ? {} : { address: "Enter the street address first." }),
        ...(city ? {} : { city: "Enter the city or area first." }),
      }));

      setConfirmation("Enter the address and city before finding coordinates.");
      return;
    }

    setIsFindingCoordinates(true);
    setConfirmation("");

    try {
      const coordinateResult = await findCoordinatesForAddress(address, city);

      if (!coordinateResult) {
        setConfirmation(
          "No coordinates were found. Try writing the full address like: 1200 Kennedy Road, Scarborough, ON, Canada.",
        );
        return;
      }

      setForm((current) => ({
        ...current,
        latitude: coordinateResult.latitude.toFixed(6),
        longitude: coordinateResult.longitude.toFixed(6),
      }));

      setErrors((current) => ({
        ...current,
        address: "",
        city: "",
        latitude: "",
        longitude: "",
      }));

      setConfirmation(
        `Coordinates found using ${coordinateResult.source}: ${coordinateResult.query}`,
      );
    } catch {
      setConfirmation(
        "Could not find coordinates right now. Check internet connection or enter latitude and longitude manually.",
      );
    } finally {
      setIsFindingCoordinates(false);
    }
  };

  const saveResource = () => {
    const validatedResource = validateForm();

    if (!validatedResource) return;

    if (editingResourceId) {
      const updated = updateEmergencyResource(editingResourceId, validatedResource);

      if (updated) {
        setConfirmation(`${validatedResource.name} was updated successfully.`);
        setEditingResourceId(null);
        setForm(blankForm);
      } else {
        setConfirmation("Resource could not be found for updating.");
      }

      return;
    }

    addEmergencyResource(validatedResource);
    setConfirmation(`${validatedResource.name} was added and saved.`);
    setForm(blankForm);
  };

  const deleteResourceNow = (resource: EmergencyResource) => {
    const deleted = deleteEmergencyResource(resource.id);

    if (!deleted) {
      setConfirmation("Resource could not be found for deleting.");
      return;
    }

    if (editingResourceId === resource.id) {
      resetForm();
    }

    setConfirmation(`${resource.name} was deleted.`);
  };

  const confirmDelete = (resource: EmergencyResource) => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        `Delete ${resource.name}? This will remove it from RescueBridge resource availability.`,
      );

      if (confirmed) {
        deleteResourceNow(resource);
      }

      return;
    }

    Alert.alert(
      "Delete resource?",
      `This will remove ${resource.name} from RescueBridge resource availability.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteResourceNow(resource),
        },
      ],
    );
  };

  const togglePublish = (resource: EmergencyResource) => {
    const nextPublishedState = !resource.isPublished;
    toggleEmergencyResourcePublished(resource.id, nextPublishedState);

    setConfirmation(
      `${resource.name} is now ${nextPublishedState ? "published" : "hidden"}.`,
    );
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: "Manage Resources" }} />

      <SectionTitle
        title="Manage Emergency Resources"
        subtitle="Add, update, publish, hide, or delete food, water, and medical resources shown to affected users."
      />

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{emergencyResources.length}</Text>
          <Text style={styles.summaryLabel}>Total resources</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{publishedEmergencyResources.length}</Text>
          <Text style={styles.summaryLabel}>Visible to users</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {emergencyResources.reduce((total, resource) => total + resource.quantity, 0)}
          </Text>
          <Text style={styles.summaryLabel}>Units listed</Text>
        </Card>
      </View>

      <Card accentColor={ROLE_COLORS.organization.main} style={styles.formCard}>
        <Text style={styles.formTitle}>
          {editingResource ? `Editing: ${editingResource.name}` : "Add or update resource"}
        </Text>

        <FormInput
          label="Resource name"
          required
          placeholder="Example: Emergency Water Station"
          value={form.name}
          onChangeText={(value) => updateField("name", value)}
          error={errors.name}
        />

        <Text style={styles.groupLabel}>Resource category</Text>
        <View style={styles.statusGrid}>
          {categories.map((category) => (
            <View key={category} style={styles.statusItem}>
              <SelectOption
                label={`${getCategoryIcon(category)} ${category}`}
                selected={form.category === category}
                onPress={() => updateField("category", category)}
              />
            </View>
          ))}
        </View>

        <FormInput
          label="Street address"
          required
          placeholder="Example: 300 Borough Drive"
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

        <Card accentColor={COLORS.info} style={styles.coordinateHelperCard}>
          <Text style={styles.coordinateHelperTitle}>Location coordinates</Text>
          <Text style={styles.coordinateHelperText}>
            Enter the street address and city, then tap the button to fill latitude and longitude
            automatically.
          </Text>

          <AppButton
            title="Use Address Coordinates"
            onPress={fillCoordinatesFromAddress}
            variant="secondary"
            loading={isFindingCoordinates}
          />
        </Card>

        <FormInput
          label="Contact number"
          required
          placeholder="Example: 416-555-0199"
          value={form.contactNumber}
          onChangeText={(value) => updateField("contactNumber", value)}
          keyboardType="phone-pad"
          error={errors.contactNumber}
        />

        <View style={styles.twoColumn}>
          <View style={styles.half}>
            <FormInput
              label="Quantity"
              required
              value={form.quantity}
              onChangeText={(value) => updateField("quantity", value)}
              keyboardType="numeric"
              error={errors.quantity}
            />
          </View>

          <View style={styles.half}>
            <FormInput
              label="Unit"
              required
              placeholder="bottles / meal kits / care slots"
              value={form.unit}
              onChangeText={(value) => updateField("unit", value)}
              error={errors.unit}
            />
          </View>
        </View>

        <FormInput
          label="Availability note"
          required
          placeholder="Example: Bottled water available for pickup."
          value={form.availabilityNote}
          onChangeText={(value) => updateField("availabilityNote", value)}
          multiline
          error={errors.availabilityNote}
        />

        <FormInput
          label="Operating hours"
          required
          placeholder="Example: 24 hours"
          value={form.operatingHours}
          onChangeText={(value) => updateField("operatingHours", value)}
          error={errors.operatingHours}
        />

        <Text style={styles.groupLabel}>Resource status</Text>
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
              description="Affected users can see this resource if quantity is available."
              selected={form.isPublished}
              onPress={() => updateField("isPublished", true)}
            />
          </View>

          <View style={styles.statusItem}>
            <SelectOption
              label="Draft / Hidden"
              description="Keep this resource hidden from affected users."
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
          title={editingResourceId ? "Save Resource Changes" : "Add Resource"}
          onPress={saveResource}
          variant="success"
        />

        {editingResourceId ? (
          <AppButton title="Cancel Editing" onPress={resetForm} variant="outline" />
        ) : null}
      </Card>

      <SectionTitle
        title="Current Resource Records"
        subtitle="Only published resources with quantity available and Open/Limited status appear to affected individuals."
      />

      {emergencyResources.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No resources added"
          message="Add a food, water, or medical resource above so affected individuals can find it during an emergency."
        />
      ) : (
        emergencyResources.map((resource) => (
          <Card
            key={resource.id}
            accentColor={resource.isPublished ? COLORS.success : COLORS.disabled}
          >
            <View style={styles.resourceHeader}>
              <Text style={styles.resourceIcon}>{getCategoryIcon(resource.category)}</Text>

              <View style={styles.resourceTitleWrap}>
                <Text style={styles.resourceName}>{resource.name}</Text>
                <Text style={styles.resourceAddress}>
                  {resource.address}, {resource.city}
                </Text>
              </View>

              <View style={styles.badges}>
                <StatusBadge label={resource.status} />
                <StatusBadge label={resource.isPublished ? "Published" : "Hidden"} />
              </View>
            </View>

            <View style={styles.detailGrid}>
              <View style={styles.detailBox}>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>{resource.category}</Text>
              </View>

              <View style={styles.detailBox}>
                <Text style={styles.detailLabel}>Quantity</Text>
                <Text style={styles.detailValue}>
                  {resource.quantity} {resource.unit}
                </Text>
              </View>

              <View style={styles.detailBox}>
                <Text style={styles.detailLabel}>Contact</Text>
                <Text style={styles.detailValue}>{resource.contactNumber}</Text>
              </View>
            </View>

            <Text style={styles.detailText}>Availability: {resource.availabilityNote}</Text>
            <Text style={styles.detailText}>Hours: {resource.operatingHours}</Text>
            <Text style={styles.detailText}>
              Coordinates: {resource.latitude}, {resource.longitude}
            </Text>
            <Text style={styles.updatedText}>Updated: {formatDateTime(resource.updatedAt)}</Text>

            <View style={styles.actionRow}>
              <AppButton
                title="Edit"
                onPress={() => startEditing(resource)}
                variant="secondary"
                style={styles.actionButton}
              />

              <AppButton
                title={resource.isPublished ? "Hide" : "Publish"}
                onPress={() => togglePublish(resource)}
                variant="outline"
                style={styles.actionButton}
              />

              <AppButton
                title="Delete"
                onPress={() => confirmDelete(resource)}
                variant="danger"
                style={styles.actionButton}
              />
            </View>
          </Card>
        ))
      )}

      <AppButton
        title="View Affected Resources Screen"
        onPress={() => router.push("/affected/resources" as any)}
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
  coordinateHelperCard: {
    backgroundColor: COLORS.infoLight,
    marginBottom: SPACING.md,
  },
  coordinateHelperTitle: {
    color: COLORS.primaryDark,
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
  },
  coordinateHelperText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
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
  resourceHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  resourceIcon: {
    fontSize: 30,
  },
  resourceTitleWrap: {
    flex: 1,
  },
  resourceName: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
  },
  resourceAddress: {
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
    fontSize: FONT_SIZE.sm,
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