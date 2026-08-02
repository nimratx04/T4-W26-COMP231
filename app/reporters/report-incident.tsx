import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View, Pressable, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import FormInput from "../../components/FormInput";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";
import SelectOption from "../../components/SelectOption";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../constants/theme";
import { useAppContext } from "../../context/AppContext";
import { supabase } from "../../lib/supabase";
import type { Priority } from "../../types";

const incidentTypes = ["Flood", "Fire", "Power Outage", "Blocked Road", "Unsafe Condition", "Other"];
const priorities: Priority[] = ["Low", "Medium", "High", "Urgent"];

export default function ReportIncidentScreen() {
  const router = useRouter();
  const { updateReportDraft, reportDraft } = useAppContext();

  const [type, setType] = useState(reportDraft.type || "");
  const [description, setDescription] = useState(reportDraft.description || "");
  const [location, setLocation] = useState(reportDraft.location || "");
  const [urgency, setUrgency] = useState<Priority | "">(reportDraft.urgency || "");
  const [photoName, setPhotoName] = useState(reportDraft.photoName || "");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setErrors((prev) => ({ ...prev, photo: "Camera roll permission is required." }));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, photo: "File size must be less than 5MB." }));
        return;
      }
      if (!asset.uri.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        setErrors((prev) => ({ ...prev, photo: "Only image files are allowed." }));
        return;
      }
      setPhotoUri(asset.uri);
      const fileName = asset.uri.split("/").pop() || `photo-${Date.now()}.jpg`;
      setPhotoName(fileName);
      updateReportDraft({ photoName: fileName });
      setErrors((prev) => ({ ...prev, photo: "" }));
    }
  };

  const removePhoto = () => {
    setPhotoUri(null);
    setPhotoName("");
    updateReportDraft({ photoName: "" });
  };

  const submit = async () => {
    const nextErrors: Record<string, string> = {};
    if (!type.trim()) nextErrors.type = "Select the type of incident.";
    if (!description.trim()) nextErrors.description = "Describe what is happening.";
    if (!location.trim()) nextErrors.location = "Enter the location of the incident.";
    if (!urgency) nextErrors.urgency = "Choose a priority level.";
    setErrors(nextErrors);
    setConfirmation("");
    if (Object.keys(nextErrors).length > 0 || !urgency) return;
    setIsSubmitting(true);
    try {
      let uploadedPhotoName = photoName.trim() || null;
      if (photoUri) {
        const formData = new FormData();
        formData.append("file", {
          uri: photoUri,
          name: photoName || `photo-${Date.now()}.jpg`,
          type: "image/jpeg",
        } as any);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("incident-photos")
          .upload(`public/${Date.now()}-${photoName || "photo.jpg"}`, formData);
        if (uploadError) {
          uploadedPhotoName = photoName.trim() || null;
        } else {
          uploadedPhotoName = uploadData?.path || photoName.trim() || null;
        }
      }

      // ✅ FIXED: Using "reporters" table
      const { data, error } = await supabase
        .from("reporters")
        .insert({
          incident_type: type.trim(),
          description: description.trim(),
          location: location.trim(),
          urgency: urgency,
          photo_name: uploadedPhotoName,
          status: "Pending Verification",
        })
        .select("id")
        .single();

      if (error) {
        console.log("🔥 REAL SUPABASE ERROR:", error);
        setErrors({ submit: `Database Error: ${error.message || error.details}` });
        return;
      }
      updateReportDraft({ type: "", description: "", location: "", urgency: "", photoName: "" });
      const shortId = data?.id ? String(data.id).slice(0, 8) : "saved";
      setConfirmation(`Incident report ${shortId} was submitted with Pending Verification status.`);
      setType("");
      setDescription("");
      setLocation("");
      setUrgency("");
      setPhotoName("");
      setPhotoUri(null);
      setErrors({});
    } catch (err: any) {
      console.error("CATCH ERROR:", err);
      setErrors({ submit: `Error: ${err.message || "Something went wrong."}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateDraft = (field: string, value: string) => {
    updateReportDraft({ [field]: value });
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: "Report Incident" }} />
      <SectionTitle title="Report an Incident" subtitle="Submit a report about a flood, fire, power outage, or other emergency situation." />
      <Text style={styles.label}>Incident type *</Text>
      <View style={styles.grid}>
        {incidentTypes.map((item) => (
          <View key={item} style={styles.half}>
            <SelectOption label={item} selected={type === item} onPress={() => { setType(item); updateDraft("type", item); setErrors((current) => ({ ...current, type: "" })); }} />
          </View>
        ))}
      </View>
      {errors.type ? <Text style={styles.error}>{errors.type}</Text> : null}
      <FormInput label="Description" required placeholder="Describe what is happening" value={description} onChangeText={(value) => { setDescription(value); updateDraft("description", value); if (value.trim()) setErrors((current) => ({ ...current, description: "" })); }} multiline maxLength={500} error={errors.description} />
      <FormInput label="Location" required placeholder="Address, intersection, or nearby landmark" value={location} onChangeText={(value) => { setLocation(value); updateDraft("location", value); if (value.trim()) setErrors((current) => ({ ...current, location: "" })); }} error={errors.location} />
      <Text style={styles.label}>Priority *</Text>
      <View style={styles.grid}>
        {priorities.map((item) => (
          <View key={item} style={styles.half}>
            <SelectOption label={item} description={item === "Urgent" ? "Immediate danger" : item === "High" ? "Needs attention soon" : item === "Medium" ? "Important but stable" : "Can safely wait"} selected={urgency === item} onPress={() => { setUrgency(item); updateDraft("urgency", item); setErrors((current) => ({ ...current, urgency: "" })); }} />
          </View>
        ))}
      </View>
      {errors.urgency ? <Text style={styles.error}>{errors.urgency}</Text> : null}
      <Text style={styles.label}>Optional photo</Text>
      <View style={styles.photoSection}>
        {photoUri ? (
          <View style={styles.photoPreview}>
            <Image source={{ uri: photoUri }} style={styles.photoImage} />
            <Pressable onPress={removePhoto} style={styles.removePhoto}><Text style={styles.removePhotoText}>✕</Text></Pressable>
            <Text style={styles.photoName}>{photoName}</Text>
          </View>
        ) : (
          <Pressable onPress={pickImage} style={styles.photoButton}>
            <Text style={styles.photoButtonIcon}>📷</Text>
            <Text style={styles.photoButtonText}>Tap to attach a photo</Text>
            <Text style={styles.photoButtonSubtext}>JPG, PNG, GIF (Max 5MB)</Text>
          </Pressable>
        )}
        {errors.photo ? <Text style={styles.error}>{errors.photo}</Text> : null}
      </View>
      {errors.submit ? (
        <Card accentColor={COLORS.emergency} style={styles.errorCard}>
          <Text style={styles.errorTitle}>Database error</Text>
          <Text style={styles.errorText}>{errors.submit}</Text>
        </Card>
      ) : null}
      {confirmation ? (
        <Card accentColor={COLORS.success} style={styles.confirmation}>
          <Text style={styles.confirmationTitle}>Report submitted</Text>
          <Text style={styles.confirmationText}>{confirmation}</Text>
          <AppButton title="View My Reports" onPress={() => router.push("/reporters/my-reports")} variant="success" />
        </Card>
      ) : null}
      <AppButton title={isSubmitting ? "Submitting..." : "Submit Report"} onPress={submit} variant="danger" disabled={isSubmitting} />
    </Screen>
  );
}
const styles = StyleSheet.create({
  label: { color: COLORS.text, fontSize: FONT_SIZE.sm, fontWeight: "800", marginBottom: SPACING.sm },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -SPACING.xs, marginBottom: SPACING.sm },
  half: { width: "50%", paddingHorizontal: SPACING.xs },
  error: { color: COLORS.emergency, fontSize: FONT_SIZE.xs, marginTop: -SPACING.sm, marginBottom: SPACING.lg },
  errorCard: { backgroundColor: COLORS.emergencyLight, marginTop: SPACING.sm },
  errorTitle: { color: COLORS.emergencyDark, fontSize: FONT_SIZE.lg, fontWeight: "900" },
  errorText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, lineHeight: 20, marginTop: SPACING.xs },
  confirmation: { backgroundColor: COLORS.successLight, marginTop: SPACING.sm },
  confirmationTitle: { color: COLORS.success, fontSize: FONT_SIZE.lg, fontWeight: "900" },
  confirmationText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, lineHeight: 20, marginVertical: SPACING.sm },
  photoSection: { marginBottom: SPACING.lg },
  photoButton: { backgroundColor: COLORS.surfaceMuted, borderColor: COLORS.border, borderWidth: 2, borderStyle: "dashed", borderRadius: RADIUS.md, padding: SPACING.xl, alignItems: "center", justifyContent: "center", minHeight: 100 },
  photoButtonIcon: { fontSize: 32, marginBottom: SPACING.sm },
  photoButtonText: { color: COLORS.text, fontSize: FONT_SIZE.sm, fontWeight: "700" },
  photoButtonSubtext: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs, marginTop: SPACING.xs },
  photoPreview: { position: "relative", backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: "center" },
  photoImage: { width: 200, height: 150, borderRadius: RADIUS.sm, resizeMode: "cover" },
  photoName: { color: COLORS.textSecondary, fontSize: FONT_SIZE.xs, marginTop: SPACING.sm },
  removePhoto: { position: "absolute", top: -8, right: -8, backgroundColor: COLORS.emergency, borderRadius: RADIUS.round, width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  removePhotoText: { color: COLORS.white, fontSize: FONT_SIZE.sm, fontWeight: "900" },
});