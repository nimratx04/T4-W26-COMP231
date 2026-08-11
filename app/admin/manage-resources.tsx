import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import FormInput from "../../components/FormInput";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";
import SelectOption from "../../components/SelectOption";
import StatusBadge from "../../components/StatusBadge";
import { COLORS, FONT_SIZE, ROLE_COLORS, SPACING } from "../../constants/theme";
import { supabase } from "../../lib/supabase";

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
  updated_at: string | null;
};

const statusOptions = ["Open", "Limited", "Full", "Closed"] as const;

export default function ManageResourcesScreen() {
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [selected, setSelected] = useState<ResourceRow | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [distance, setDistance] = useState("0");
  const [beds, setBeds] = useState("0");
  const [food, setFood] = useState("0");
  const [water, setWater] = useState("0");
  const [medicalSupport, setMedicalSupport] = useState("");
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("Open");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadResources = async () => {
    setIsLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("resources")
      .select(
        "id, organization_name, type, address, distance_km, status, beds, beds_available, food_available, water_available, medical_support, updated_at"
      )
      .order("distance_km", { ascending: true });

    if (error) {
      setResources([]);
      setMessage(`Could not load resources: ${error.message}`);
    } else {
      setResources((data || []) as ResourceRow[]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadResources();
  }, []);

  const openResource = (resource: ResourceRow) => {
    setSelected(resource);
    setName(resource.organization_name || "");
    setAddress(resource.address || "");
    setDistance(String(resource.distance_km ?? 0));
    setBeds(String(resource.beds ?? resource.beds_available ?? 0));
    setFood(String(resource.food_available ?? 0));
    setWater(String(resource.water_available ?? 0));
    setMedicalSupport(resource.medical_support || "");
    const nextStatus = statusOptions.includes(resource.status as any)
      ? (resource.status as (typeof statusOptions)[number])
      : "Open";
    setStatus(nextStatus);
    setMessage("");
  };

  const save = async () => {
    if (!selected) return;

    const parsedDistance = Number(distance);
    const parsedBeds = Number(beds);
    const parsedFood = Number(food);
    const parsedWater = Number(water);

    if (
      !name.trim() ||
      !address.trim() ||
      [parsedDistance, parsedBeds, parsedFood, parsedWater].some(
        (value) => Number.isNaN(value) || value < 0
      )
    ) {
      setMessage("Enter a name, address, and valid zero-or-positive numbers before saving.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("resources")
      .update({
        organization_name: name.trim(),
        address: address.trim(),
        distance_km: parsedDistance,
        status,
        beds: parsedBeds,
        beds_available: parsedBeds,
        food_available: parsedFood,
        water_available: parsedWater,
        medical_support: medicalSupport.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", selected.id);

    if (error) {
      setMessage(`Could not save resource changes: ${error.message}`);
    } else {
      setMessage("Resource changes saved to Supabase.");
      setSelected(null);
      await loadResources();
    }

    setIsSaving(false);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: "Resources & Shelters" }} />
      <SectionTitle
        title="Manage Resources & Shelters"
        subtitle="Select a resource, review its availability, and update the correct database record."
      />

      {message ? (
        <Card accentColor={message.includes("saved") ? COLORS.success : COLORS.warning}>
          <Text style={styles.message}>{message}</Text>
        </Card>
      ) : null}

      {selected ? (
        <Card accentColor={ROLE_COLORS.admin.main}>
          <Text style={styles.editorTitle}>{selected.type || "Resource"}</Text>
          <FormInput label="Resource / organization name" required value={name} onChangeText={setName} />
          <FormInput label="Address" required value={address} onChangeText={setAddress} />
          <FormInput label="Distance (km)" required keyboardType="decimal-pad" value={distance} onChangeText={setDistance} />
          <FormInput label="Beds available" required keyboardType="number-pad" value={beds} onChangeText={setBeds} />
          <FormInput label="Food units" required keyboardType="number-pad" value={food} onChangeText={setFood} />
          <FormInput label="Water units" required keyboardType="number-pad" value={water} onChangeText={setWater} />
          <FormInput label="Medical support" value={medicalSupport} onChangeText={setMedicalSupport} multiline />

          <Text style={styles.label}>Status</Text>
          {statusOptions.map((option) => (
            <SelectOption
              key={option}
              label={option}
              selected={status === option}
              onPress={() => setStatus(option)}
              compact
            />
          ))}

          <View style={styles.buttonRow}>
            <AppButton title="Cancel" onPress={() => setSelected(null)} variant="outline" style={styles.flex} disabled={isSaving} />
            <AppButton title="Save Changes" onPress={save} variant="success" style={styles.flex} loading={isSaving} />
          </View>
        </Card>
      ) : isLoading ? (
        <Card><Text style={styles.message}>Loading resources...</Text></Card>
      ) : resources.length === 0 ? (
        <EmptyState
          icon="🏠"
          title="No resources found"
          message="Run the Phase B Supabase migration or add resource records before testing this screen."
        />
      ) : (
        resources.map((resource) => (
          <Card key={resource.id} accentColor={ROLE_COLORS.admin.main}>
            <View style={styles.headerRow}>
              <View style={styles.flex}>
                <Text style={styles.title}>{resource.organization_name || "Unnamed resource"}</Text>
                <Text style={styles.meta}>{resource.type || "Resource"} • {Number(resource.distance_km || 0).toFixed(1)} km</Text>
              </View>
              <StatusBadge label={resource.status || "Open"} />
            </View>
            <Text style={styles.meta}>📍 {resource.address || "No address"}</Text>
            <Text style={styles.meta}>Beds: {resource.beds ?? resource.beds_available ?? 0} • Food: {resource.food_available ?? 0} • Water: {resource.water_available ?? 0}</Text>
            <AppButton title="Manage Resource" onPress={() => openResource(resource)} variant="secondary" />
          </Card>
        ))
      )}

      {!selected ? <AppButton title="Refresh Resources" onPress={loadResources} variant="secondary" /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  message: { color: COLORS.text, fontSize: FONT_SIZE.sm, lineHeight: 20, fontWeight: "700" },
  editorTitle: { color: ROLE_COLORS.admin.main, fontSize: FONT_SIZE.lg, fontWeight: "900", marginBottom: SPACING.md },
  label: { color: COLORS.text, fontSize: FONT_SIZE.sm, fontWeight: "800", marginBottom: SPACING.sm },
  buttonRow: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md },
  flex: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: SPACING.sm },
  title: { color: COLORS.text, fontSize: FONT_SIZE.lg, fontWeight: "900" },
  meta: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, lineHeight: 20, marginTop: SPACING.xs },
});
