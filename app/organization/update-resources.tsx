import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import FormInput from "../../components/FormInput";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";
import { COLORS, FONT_SIZE, SPACING } from "../../constants/theme";
import { useAppContext } from "../../context/AppContext";
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
  updated_at: string;
};

const getNumberText = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? String(numberValue) : "0";
};

export default function UpdateResourcesScreen() {
  const router = useRouter();
  const { resources, resourceDraft, updateResources } = useAppContext();

  const starting = resourceDraft ?? resources;

  const [beds, setBeds] = useState(String(starting.beds));
  const [food, setFood] = useState(String(starting.food));
  const [water, setWater] = useState(String(starting.water));
  const [blanketsSupplies, setBlanketsSupplies] = useState(starting.blanketsSupplies);
  const [medicalSupport, setMedicalSupport] = useState(starting.medicalSupport);
  const [contactNumber, setContactNumber] = useState(starting.contactNumber);
  const [operatingHours, setOperatingHours] = useState(starting.operatingHours);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadMessage, setLoadMessage] = useState("");

  const loadLatestResources = async () => {
    setIsLoading(true);
    setLoadMessage("");

    const { data, error } = await supabase
      .from("resources")
      .select(
        "id, organization_name, beds, food_available, water_available, blankets_supplies, medical_support, contact_number, operating_hours, updated_at"
      )
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      setLoadMessage("Could not load latest resources from Supabase. You can still enter new values.");
    } else if (data) {
      const resource = data as ResourceRow;

      setBeds(getNumberText(resource.beds));
      setFood(getNumberText(resource.food_available));
      setWater(getNumberText(resource.water_available));
      setBlanketsSupplies(resource.blankets_supplies || "");
      setMedicalSupport(resource.medical_support || "");
      setContactNumber(resource.contact_number || "");
      setOperatingHours(resource.operating_hours || "");

      updateResources({
        beds: Number(resource.beds) || 0,
        food: Number(resource.food_available) || 0,
        water: Number(resource.water_available) || 0,
        blanketsSupplies: resource.blankets_supplies || "",
        medicalSupport: resource.medical_support || "",
        contactNumber: resource.contact_number || "",
        operatingHours: resource.operating_hours || "",
        updatedAt: resource.updated_at,
      });
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadLatestResources();
  }, []);

  const continueToReview = () => {
    const nextErrors: Record<string, string> = {};

    const parsedBeds = Number(beds);
    const parsedFood = Number(food);
    const parsedWater = Number(water);

    if (!beds.trim() || Number.isNaN(parsedBeds) || parsedBeds < 0) {
      nextErrors.beds = "Enter zero or a positive number.";
    }

    if (!food.trim() || Number.isNaN(parsedFood) || parsedFood < 0) {
      nextErrors.food = "Enter zero or a positive number.";
    }

    if (!water.trim() || Number.isNaN(parsedWater) || parsedWater < 0) {
      nextErrors.water = "Enter zero or a positive number.";
    }

    if (!blanketsSupplies.trim()) {
      nextErrors.blanketsSupplies = "Describe the available blankets and supplies.";
    }

    if (!medicalSupport.trim()) {
      nextErrors.medicalSupport = "Describe the available medical support or enter None.";
    }

    if (!contactNumber.trim()) {
      nextErrors.contactNumber = "Enter an organization contact number.";
    }

    if (!operatingHours.trim()) {
      nextErrors.operatingHours = "Enter current operating hours.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    updateResources({
      beds: parsedBeds,
      food: parsedFood,
      water: parsedWater,
      blanketsSupplies: blanketsSupplies.trim(),
      medicalSupport: medicalSupport.trim(),
      contactNumber: contactNumber.trim(),
      operatingHours: operatingHours.trim(),
      updatedAt: new Date().toISOString(),
    });

    router.push("/organization/review-save-resources" as any);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: "Update Resources" }} />

      <SectionTitle
        title="Update Resource Availability"
        subtitle="Latest resource information is loaded from Supabase, then staged for review before publishing."
      />

      <Card accentColor={COLORS.primary} style={styles.helpCard}>
        <Text style={styles.helpTitle}>Use current available quantities</Text>
        <Text style={styles.helpText}>
          Enter 0 when an item is unavailable. Do not leave required fields blank.
        </Text>
      </Card>

      {isLoading ? (
        <Card>
          <Text style={styles.loadingText}>Loading latest resources from Supabase...</Text>
        </Card>
      ) : null}

      {loadMessage ? (
        <Card accentColor={COLORS.warning} style={styles.warningCard}>
          <Text style={styles.warningText}>{loadMessage}</Text>
        </Card>
      ) : null}

      <FormInput
        label="Available beds"
        required
        keyboardType="number-pad"
        value={beds}
        onChangeText={(value) => {
          setBeds(value);
          if (value.trim()) setErrors((current) => ({ ...current, beds: "" }));
        }}
        error={errors.beds}
      />

      <FormInput
        label="Prepared meals / food units"
        required
        keyboardType="number-pad"
        value={food}
        onChangeText={(value) => {
          setFood(value);
          if (value.trim()) setErrors((current) => ({ ...current, food: "" }));
        }}
        error={errors.food}
      />

      <FormInput
        label="Water bottles / units"
        required
        keyboardType="number-pad"
        value={water}
        onChangeText={(value) => {
          setWater(value);
          if (value.trim()) setErrors((current) => ({ ...current, water: "" }));
        }}
        error={errors.water}
      />

      <FormInput
        label="Blankets and supplies"
        required
        value={blanketsSupplies}
        onChangeText={(value) => {
          setBlanketsSupplies(value);
          if (value.trim()) setErrors((current) => ({ ...current, blanketsSupplies: "" }));
        }}
        multiline
        error={errors.blanketsSupplies}
      />

      <FormInput
        label="Medical support"
        required
        value={medicalSupport}
        onChangeText={(value) => {
          setMedicalSupport(value);
          if (value.trim()) setErrors((current) => ({ ...current, medicalSupport: "" }));
        }}
        multiline
        error={errors.medicalSupport}
      />

      <FormInput
        label="Contact number"
        required
        keyboardType="phone-pad"
        value={contactNumber}
        onChangeText={(value) => {
          setContactNumber(value);
          if (value.trim()) setErrors((current) => ({ ...current, contactNumber: "" }));
        }}
        error={errors.contactNumber}
      />

      <FormInput
        label="Operating hours"
        required
        placeholder="Example: 24 hours or 8:00 AM–10:00 PM"
        value={operatingHours}
        onChangeText={(value) => {
          setOperatingHours(value);
          if (value.trim()) setErrors((current) => ({ ...current, operatingHours: "" }));
        }}
        error={errors.operatingHours}
      />

      <AppButton title="Continue to Review" onPress={continueToReview} disabled={isLoading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  helpCard: {
    backgroundColor: COLORS.primaryLight,
  },
  helpTitle: {
    color: COLORS.primaryDark,
    fontSize: FONT_SIZE.sm,
    fontWeight: "800",
  },
  helpText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
    marginTop: SPACING.xs,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  warningCard: {
    backgroundColor: COLORS.warningLight,
  },
  warningText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
  },
});