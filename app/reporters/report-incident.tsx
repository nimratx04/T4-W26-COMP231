import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
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

const incidentTypes = [
  "Flood",
  "Fire",
  "Power Outage",
  "Blocked Road",
  "Unsafe Condition",
  "Other",
];

const priorities: Priority[] = ["Low", "Medium", "High", "Urgent"];

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);
const ALLOWED_PHOTO_EXTENSION = /\.(jpe?g|png|gif|webp)$/i;

const getPhotoMimeType = (fileName: string, mimeType: string) => {
  if (mimeType) return mimeType;
  if (fileName.toLowerCase().endsWith(".png")) return "image/png";
  if (fileName.toLowerCase().endsWith(".gif")) return "image/gif";
  if (fileName.toLowerCase().endsWith(".webp")) return "image/webp";
  return "image/jpeg";
};

export default function ReportIncidentScreen() {
  const router = useRouter();
  const { updateReportDraft, clearReportDraft, reportDraft } = useAppContext();

  const [type, setType] = useState(reportDraft.type || "");
  const [description, setDescription] = useState(reportDraft.description || "");
  const [location, setLocation] = useState(reportDraft.location || "");
  const [urgency, setUrgency] = useState<Priority | "">(reportDraft.urgency || "");
  const [photoName, setPhotoName] = useState(reportDraft.photoName || "");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoMimeType, setPhotoMimeType] = useState("image/jpeg");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearFieldError = (field: string) => {
    setErrors((current) => ({ ...current, [field]: "", submit: "" }));
    setConfirmation("");
  };

  const updateType = (value: string) => {
    setType(value);
    updateReportDraft({ type: value });
    clearFieldError("type");
  };

  const updateDescription = (value: string) => {
    setDescription(value);
    updateReportDraft({ description: value });
    clearFieldError("description");
  };

  const updateLocation = (value: string) => {
    setLocation(value);
    updateReportDraft({ location: value });
    clearFieldError("location");
  };

  const updateUrgency = (value: Priority) => {
    setUrgency(value);
    updateReportDraft({ urgency: value });
    clearFieldError("urgency");
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      setErrors((current) => ({
        ...current,
        photo: "Camera roll permission is required before attaching a photo.",
      }));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    const candidateName = asset.fileName || asset.uri.split("/").pop() || "";
    const mimeType = (asset.mimeType || "").toLowerCase();

    const validType =
      (mimeType && ALLOWED_PHOTO_MIME_TYPES.has(mimeType)) ||
      ALLOWED_PHOTO_EXTENSION.test(candidateName);

    if (typeof asset.fileSize === "number" && asset.fileSize > MAX_PHOTO_BYTES) {
      setErrors((current) => ({
        ...current,
        photo: "Photo must be 5 MB or smaller.",
      }));
      return;
    }

    if (!validType) {
      setErrors((current) => ({
        ...current,
        photo: "Only JPG, JPEG, PNG, GIF, or WEBP image files are allowed.",
      }));
      return;
    }

    const fileName = candidateName || `photo-${Date.now()}.jpg`;

    setPhotoUri(asset.uri);
    setPhotoName(fileName);
    setPhotoMimeType(getPhotoMimeType(fileName, mimeType));
    updateReportDraft({ photoName: fileName });
    setErrors((current) => ({ ...current, photo: "" }));
    setConfirmation("");
  };

  const removePhoto = () => {
    setPhotoUri(null);
    setPhotoName("");
    setPhotoMimeType("image/jpeg");
    updateReportDraft({ photoName: "" });
    clearFieldError("photo");
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!type.trim()) {
      nextErrors.type = "Select the incident type.";
    }

    if (!description.trim()) {
      nextErrors.description = "Describe what is happening.";
    } else if (description.trim().length < 15) {
      nextErrors.description = "Add a little more detail so responders understand the situation.";
    }

    if (!location.trim()) {
      nextErrors.location = "Enter the location, address, intersection, or nearby landmark.";
    }

    if (!urgency) {
      nextErrors.urgency = "Choose a priority level.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const uploadPhoto = async () => {
    if (!photoUri) {
      return photoName.trim() || null;
    }

    const formData = new FormData();

    formData.append("file", {
      uri: photoUri,
      name: photoName || `photo-${Date.now()}.jpg`,
      type: photoMimeType,
    } as any);

    const { data, error } = await supabase.storage
      .from("incident-photos")
      .upload(`public/${Date.now()}-${photoName || "photo.jpg"}`, formData);

    if (error) {
      return photoName.trim() || null;
    }

    return data?.path || photoName.trim() || null;
  };

  const resetForm = () => {
    setType("");
    setDescription("");
    setLocation("");
    setUrgency("");
    setPhotoName("");
    setPhotoUri(null);
    setPhotoMimeType("image/jpeg");
    clearReportDraft();
  };

  const submit = async () => {
    setConfirmation("");

    if (!validateForm() || !urgency) {
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadedPhotoName = await uploadPhoto();

      const { data, error } = await supabase
        .from("reporters")
        .insert({
          incident_type: type.trim(),
          description: description.trim(),
          location: location.trim(),
          urgency,
          photo_name: uploadedPhotoName,
          status: "Pending Verification",
        })
        .select("id, created_at")
        .single();

      if (error) {
        setErrors({ submit: `Database Error: ${error.message || error.details}` });
        return;
      }

      const shortId = data?.id ? String(data.id).slice(0, 8) : "saved";
      const submittedAt = data?.created_at
        ? new Date(data.created_at).toLocaleString()
        : new Date().toLocaleString();

      setErrors({});
      setConfirmation(
        `Incident report ${shortId} was submitted successfully at ${submittedAt}. Status: Pending Verification.`,
      );
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      setErrors({ submit: `Error: ${message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: "Report Incident" }} />

      <SectionTitle
        title="Report an Incident"
        subtitle="Submit verified location, description, urgency, and optional photo evidence."
      />

      <Card accentColor={COLORS.warning} style={styles.requirementCard}>
        <Text style={styles.requirementTitle}>Required before submission</Text>
        <Text style={styles.requirementText}>
          Incident type, description, location, and priority are required. Photo evidence is optional.
        </Text>
      </Card>

      <Text style={styles.label}>Incident type *</Text>
      <View style={styles.grid}>
        {incidentTypes.map((item) => (
          <View key={item} style={styles.half}>
            <SelectOption
              label={item}
              selected={type === item}
              onPress={() => updateType(item)}
            />
          </View>
        ))}
      </View>
      {errors.type ? <Text style={styles.error}>{errors.type}</Text> : null}

      <FormInput
        label="Description"
        required
        placeholder="Describe what is happening"
        value={description}
        onChangeText={updateDescription}
        multiline
        maxLength={500}
        error={errors.description}
      />

      <FormInput
        label="Location"
        required
        placeholder="Address, intersection, or nearby landmark"
        value={location}
        onChangeText={updateLocation}
        error={errors.location}
      />

      <Text style={styles.label}>Priority *</Text>
      <View style={styles.grid}>
        {priorities.map((item) => (
          <View key={item} style={styles.half}>
            <SelectOption
              label={item}
              description={
                item === "Urgent"
                  ? "Immediate danger"
                  : item === "High"
                    ? "Needs attention soon"
                    : item === "Medium"
                      ? "Important but stable"
                      : "Can safely wait"
              }
              selected={urgency === item}
              onPress={() => updateUrgency(item)}
            />
          </View>
        ))}
      </View>
      {errors.urgency ? <Text style={styles.error}>{errors.urgency}</Text> : null}

      <Text style={styles.label}>Optional photo</Text>
      <View style={styles.photoSection}>
        {photoUri ? (
          <View style={styles.photoPreview}>
            <Image source={{ uri: photoUri }} style={styles.photoImage} />

            <Pressable onPress={removePhoto} style={styles.removePhoto}>
              <Text style={styles.removePhotoText}>✕</Text>
            </Pressable>

            <Text style={styles.photoName}>{photoName}</Text>
          </View>
        ) : (
          <Pressable onPress={pickImage} style={styles.photoButton}>
            <Text style={styles.photoButtonIcon}>📷</Text>
            <Text style={styles.photoButtonText}>Tap to attach a photo</Text>
            <Text style={styles.photoButtonSubtext}>
              JPG, JPEG, PNG, GIF, WEBP. Max 5 MB.
            </Text>
          </Pressable>
        )}

        {errors.photo ? <Text style={styles.error}>{errors.photo}</Text> : null}
      </View>

      {errors.submit ? (
        <Card accentColor={COLORS.emergency} style={styles.errorCard}>
          <Text style={styles.errorTitle}>Submission error</Text>
          <Text style={styles.errorText}>{errors.submit}</Text>
        </Card>
      ) : null}

      {confirmation ? (
        <Card accentColor={COLORS.success} style={styles.confirmation}>
          <Text style={styles.confirmationTitle}>Report submitted</Text>
          <Text style={styles.confirmationText}>{confirmation}</Text>

          <AppButton
            title="View My Reports"
            onPress={() => router.push("/reporters/my-reports" as any)}
            variant="success"
          />
        </Card>
      ) : null}

      <AppButton
        title="Submit Report"
        onPress={submit}
        variant="danger"
        loading={isSubmitting}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  requirementCard: {
    backgroundColor: COLORS.warningLight,
  },
  requirementTitle: {
    color: COLORS.warning,
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
  },
  requirementText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    marginTop: SPACING.xs,
  },
  label: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: "800",
    marginBottom: SPACING.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -SPACING.xs,
    marginBottom: SPACING.sm,
  },
  half: {
    width: "50%",
    paddingHorizontal: SPACING.xs,
  },
  error: {
    color: COLORS.emergency,
    fontSize: FONT_SIZE.xs,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.lg,
  },
  errorCard: {
    backgroundColor: COLORS.emergencyLight,
    marginTop: SPACING.sm,
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
    marginTop: SPACING.xs,
  },
  confirmation: {
    backgroundColor: COLORS.successLight,
    marginTop: SPACING.sm,
  },
  confirmationTitle: {
    color: COLORS.success,
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
  },
  confirmationText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    marginVertical: SPACING.sm,
  },
  photoSection: {
    marginBottom: SPACING.lg,
  },
  photoButton: {
    backgroundColor: COLORS.surfaceMuted,
    borderColor: COLORS.border,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: RADIUS.md,
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
  },
  photoButtonIcon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  photoButtonText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
  },
  photoButtonSubtext: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.xs,
  },
  photoPreview: {
    position: "relative",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: "center",
  },
  photoImage: {
    width: 200,
    height: 150,
    borderRadius: RADIUS.sm,
    resizeMode: "cover",
  },
  photoName: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.sm,
  },
  removePhoto: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: COLORS.emergency,
    borderRadius: RADIUS.round,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  removePhotoText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
  },
});