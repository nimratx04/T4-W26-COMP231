import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";
import SelectOption from "../../components/SelectOption";
import StatusBadge from "../../components/StatusBadge";
import { COLORS, FONT_SIZE, ROLE_COLORS, SPACING } from "../../constants/theme";
import { supabase } from "../../lib/supabase";

type Category = "All" | "Shelter" | "Food" | "Water" | "Medical";

type ResourceRow = {
  id: string;
  organization_name: string | null;
  type: string | null;
  address: string | null;
  distance_km: number | string | null;
  status: string | null;
  beds: number | null;
  beds_available: number | null;
  food_available: number | null;
  water_available: number | null;
  medical_support: string | null;
};

const categories: Category[] = ["All", "Shelter", "Food", "Water", "Medical"];

function availabilityText(resource: ResourceRow) {
  switch (resource.type) {
    case "Shelter":
      return `${resource.beds ?? resource.beds_available ?? 0} beds available`;
    case "Food":
      return `${resource.food_available ?? 0} food units available`;
    case "Water":
      return `${resource.water_available ?? 0} water units available`;
    case "Medical":
      return resource.medical_support || "Medical support information not provided";
    default:
      return "Availability information available on request";
  }
}

export default function NearbyResourcesScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const initialCategory = categories.includes(params.category as Category)
    ? (params.category as Category)
    : "All";

  const [category, setCategory] = useState<Category>(initialCategory);
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadResources = async () => {
    setIsLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("resources")
      .select("id, organization_name, type, address, distance_km, status, beds, beds_available, food_available, water_available, medical_support")
      .order("distance_km", { ascending: true });

    if (error) {
      setResources([]);
      setErrorMessage(`Could not load nearby resources: ${error.message}`);
    } else {
      setResources((data || []) as ResourceRow[]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadResources();
  }, []);

  const visibleResources = useMemo(
    () =>
      resources
        .filter((resource) => category === "All" || resource.type === category)
        .sort((a, b) => Number(a.distance_km || 0) - Number(b.distance_km || 0)),
    [category, resources]
  );

  return (
    <Screen>
      <Stack.Screen options={{ title: "Nearby Resources" }} />
      <SectionTitle
        title="Nearby Resources"
        subtitle="Filter by support type and view the nearest matching resources first."
      />

      <View style={styles.filterWrap}>
        {categories.map((item) => (
          <SelectOption
            key={item}
            label={item}
            selected={category === item}
            onPress={() => setCategory(item)}
            compact
          />
        ))}
      </View>

      {isLoading ? (
        <Card><Text style={styles.message}>Loading nearby resources...</Text></Card>
      ) : errorMessage ? (
        <Card accentColor={COLORS.emergency}>
          <Text style={styles.message}>{errorMessage}</Text>
          <AppButton title="Try Again" onPress={loadResources} variant="danger" />
        </Card>
      ) : visibleResources.length === 0 ? (
        <EmptyState
          icon="📍"
          title="No matching resources"
          message={`No ${category === "All" ? "nearby" : category.toLowerCase()} resources are currently available.`}
        />
      ) : (
        visibleResources.map((resource) => (
          <Card key={resource.id} accentColor={ROLE_COLORS.affected.main}>
            <View style={styles.headerRow}>
              <View style={styles.flex}>
                <Text style={styles.title}>{resource.organization_name || "Resource"}</Text>
                <Text style={styles.meta}>{resource.type || "Resource"}</Text>
              </View>
              <StatusBadge label={resource.status || "Open"} />
            </View>
            <Text style={styles.distance}>{Number(resource.distance_km || 0).toFixed(1)} km away</Text>
            <Text style={styles.meta}>📍 {resource.address || "Address unavailable"}</Text>
            <Text style={styles.availability}>{availabilityText(resource)}</Text>
          </Card>
        ))
      )}

      <AppButton title="Refresh Resources" onPress={loadResources} variant="secondary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterWrap: { flexDirection: "row", flexWrap: "wrap", marginBottom: SPACING.md },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: SPACING.sm },
  flex: { flex: 1 },
  title: { color: COLORS.text, fontSize: FONT_SIZE.lg, fontWeight: "900" },
  distance: { color: ROLE_COLORS.affected.main, fontSize: FONT_SIZE.sm, fontWeight: "900", marginTop: SPACING.md },
  meta: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, lineHeight: 20, marginTop: SPACING.xs },
  availability: { color: COLORS.text, fontSize: FONT_SIZE.sm, fontWeight: "700", lineHeight: 20, marginTop: SPACING.md },
  message: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, lineHeight: 20 },
});
