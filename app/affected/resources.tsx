import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";
import SelectOption from "../../components/SelectOption";
import StatusBadge from "../../components/StatusBadge";
import { COLORS, FONT_SIZE, ROLE_COLORS, SPACING } from "../../constants/theme";
import { useAppContext } from "../../context/AppContext";
import type { EmergencyResource, NearbyResource } from "../../types";

type ResourceFilter = "All" | "Food" | "Water" | "Medical" | "Shelter";

type ResourceListItem = NearbyResource & {
  latitude: number;
  longitude: number;
  navigationLabel: string;
};

const filters: ResourceFilter[] = ["All", "Food", "Water", "Medical", "Shelter"];

const getCategoryIcon = (category: NearbyResource["category"]) => {
  switch (category) {
    case "Food":
      return "🍽️";
    case "Water":
      return "💧";
    case "Medical":
      return "🏥";
    case "Shelter":
      return "🏠";
    default:
      return "📦";
  }
};

const getStatusAccent = (status: NearbyResource["status"]) => {
  switch (status) {
    case "Open":
      return COLORS.success;
    case "Limited":
      return COLORS.warning;
    case "Full":
      return COLORS.emergency;
    case "Closed":
      return COLORS.disabled;
    default:
      return COLORS.primary;
  }
};

const getDistanceValue = (distance: string) => {
  const value = Number.parseFloat(distance.replace(/[^\d.]/g, ""));
  return Number.isNaN(value) ? 999 : value;
};

const openNavigation = async (resource: ResourceListItem) => {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${resource.latitude},${resource.longitude}&travelmode=driving`;

  try {
    await Linking.openURL(url);
  } catch {
    await Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        resource.navigationLabel,
      )}`,
    );
  }
};

const mapEmergencyResourceToNearbyResource = (
  resource: EmergencyResource,
): ResourceListItem => ({
  id: resource.id,
  name: resource.name,
  category: resource.category,
  distance: "Listed by organization",
  availability: `${resource.quantity} ${resource.unit} available. ${resource.availabilityNote}`,
  status: resource.status,
  address: `${resource.address}, ${resource.city}`,
  latitude: resource.latitude,
  longitude: resource.longitude,
  navigationLabel: `${resource.name}, ${resource.address}, ${resource.city}`,
});

export default function AffectedResourcesScreen() {
  const router = useRouter();
  const { publishedShelters, publishedEmergencyResources } = useAppContext();

  const [selectedFilter, setSelectedFilter] = useState<ResourceFilter>("All");

  const combinedResources = useMemo<ResourceListItem[]>(() => {
    const shelterResourcesFromPublishedShelters: ResourceListItem[] = publishedShelters.map(
      (shelter) => ({
        id: shelter.id,
        name: shelter.name,
        category: "Shelter",
        distance: "Use shelter screen for GPS distance",
        availability: `${shelter.availableBeds} beds available. Food: ${shelter.foodSupport}, Water: ${shelter.waterSupport}.`,
        status: shelter.status,
        address: `${shelter.address}, ${shelter.city}`,
        latitude: shelter.latitude,
        longitude: shelter.longitude,
        navigationLabel: `${shelter.name}, ${shelter.address}, ${shelter.city}`,
      }),
    );

    const emergencyResourceList = publishedEmergencyResources.map(
      mapEmergencyResourceToNearbyResource,
    );

    return [...shelterResourcesFromPublishedShelters, ...emergencyResourceList];
  }, [publishedEmergencyResources, publishedShelters]);

  const filteredResources = useMemo(
    () =>
      combinedResources
        .filter((resource) =>
          selectedFilter === "All" ? true : resource.category === selectedFilter,
        )
        .sort(
          (first, second) =>
            getDistanceValue(first.distance) - getDistanceValue(second.distance),
        ),
    [combinedResources, selectedFilter],
  );

  const openCount = combinedResources.filter((resource) => resource.status === "Open").length;
  const limitedCount = combinedResources.filter(
    (resource) => resource.status === "Limited",
  ).length;

  const visibilityNote =
    combinedResources.length === 0
      ? "No published resources are available right now. Resources appear here only after organization staff publish them."
      : `${publishedEmergencyResources.length} emergency resource(s) and ${publishedShelters.length} shelter resource(s) are currently published.`;

  return (
    <Screen>
      <Stack.Screen options={{ title: "Resources" }} />

      <SectionTitle
        title="Resource Type List"
        subtitle="Filter emergency resources by food, water, medical support, and RescueBridge-published shelters."
      />

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{combinedResources.length}</Text>
          <Text style={styles.summaryLabel}>Published resources</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{openCount}</Text>
          <Text style={styles.summaryLabel}>Open</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{limitedCount}</Text>
          <Text style={styles.summaryLabel}>Limited</Text>
        </Card>
      </View>

      <Card accentColor={ROLE_COLORS.affected.main} style={styles.filterCard}>
        <Text style={styles.filterTitle}>Filter by resource type</Text>

        <View style={styles.filterGrid}>
          {filters.map((filter) => (
            <View key={filter} style={styles.filterItem}>
              <SelectOption
                label={filter}
                selected={selectedFilter === filter}
                onPress={() => setSelectedFilter(filter)}
              />
            </View>
          ))}
        </View>

        <Text style={styles.filterNote}>{visibilityNote}</Text>
      </Card>

      {filteredResources.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No resources found"
          message="No published resources match this filter right now. Try another resource type or request help."
          actionTitle="Request Help"
          onAction={() => router.push("/affected/submit-help" as any)}
        />
      ) : (
        filteredResources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))
      )}

      <AppButton
        title="View Nearby Shelters"
        onPress={() => router.push("/affected/nearby-shelters" as any)}
        variant="secondary"
      />

      <AppButton
        title="Request Help"
        onPress={() => router.push("/affected/submit-help" as any)}
        variant="danger"
      />

      <AppButton
        title="Back to Affected Dashboard"
        onPress={() => router.push("/affected" as any)}
        variant="secondary"
      />
    </Screen>
  );
}

function ResourceCard({ resource }: { resource: ResourceListItem }) {
  return (
    <Card accentColor={getStatusAccent(resource.status)}>
      <View style={styles.resourceHeader}>
        <Text style={styles.resourceIcon}>{getCategoryIcon(resource.category)}</Text>

        <View style={styles.resourceTitleWrap}>
          <Text style={styles.resourceName}>{resource.name}</Text>
          <Text style={styles.resourceAddress}>{resource.address}</Text>
        </View>

        <StatusBadge label={resource.status} />
      </View>

      <View style={styles.detailGrid}>
        <View style={styles.detailBox}>
          <Text style={styles.detailLabel}>Type</Text>
          <Text style={styles.detailValue}>{resource.category}</Text>
        </View>

        <View style={styles.detailBox}>
          <Text style={styles.detailLabel}>Distance</Text>
          <Text style={styles.detailValue}>{resource.distance}</Text>
        </View>
      </View>

      <Card style={styles.innerCard}>
        <Text style={styles.innerTitle}>Availability</Text>
        <Text style={styles.innerText}>{resource.availability}</Text>
      </Card>

      <Card style={styles.locationCard}>
        <Text style={styles.innerTitle}>Location</Text>
        <Text style={styles.innerText}>{resource.address}</Text>
        <Text style={styles.coordinateText}>
          {resource.latitude}, {resource.longitude}
        </Text>
      </Card>

      <AppButton
        title={`Navigate to ${resource.category}`}
        onPress={() => openNavigation(resource)}
        variant="success"
      />
    </Card>
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
    color: ROLE_COLORS.affected.main,
    fontSize: FONT_SIZE.xl,
    fontWeight: "900",
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    textAlign: "center",
    marginTop: 2,
  },
  filterCard: {
    backgroundColor: ROLE_COLORS.affected.light,
  },
  filterTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    marginBottom: SPACING.md,
  },
  filterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  filterItem: {
    flex: 1,
    minWidth: 135,
  },
  filterNote: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
    marginTop: SPACING.sm,
  },
  resourceHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
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
    fontSize: FONT_SIZE.xs,
    lineHeight: 17,
    marginTop: 2,
  },
  detailGrid: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  detailBox: {
    flex: 1,
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
    lineHeight: 19,
    marginTop: SPACING.xs,
    fontWeight: "700",
  },
  innerCard: {
    backgroundColor: COLORS.surfaceMuted,
    marginBottom: 0,
    marginTop: SPACING.md,
  },
  locationCard: {
    backgroundColor: COLORS.infoLight,
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
  },
  innerTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
    marginBottom: SPACING.xs,
  },
  innerText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  coordinateText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.xs,
    fontWeight: "800",
    marginTop: SPACING.xs,
  },
});