import { Stack } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import FormInput from "../../components/FormInput";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";
import SelectOption from "../../components/SelectOption";
import { COLORS, FONT_SIZE, ROLE_COLORS, SPACING } from "../../constants/theme";
import { supabase } from "../../lib/supabase";

const priorities = ["Low", "Medium", "High", "Urgent"] as const;

export default function CreateBroadcastScreen() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [area, setArea] = useState("");
  const [priority, setPriority] = useState<(typeof priorities)[number]>("High");
  const [instructions, setInstructions] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSending, setIsSending] = useState(false);

  const sendBroadcast = async () => {
    if (!title.trim() || !message.trim() || !area.trim()) {
      setFeedback("Enter a title, message, and target area before sending.");
      return;
    }

    setIsSending(true);
    setFeedback("");

    const { data, error } = await supabase
      .from("alerts")
      .insert({
        title: title.trim(),
        message: message.trim(),
        area: area.trim(),
        priority,
        type: "Emergency",
        instructions: instructions.trim() || null,
      })
      .select("id, created_at")
      .single();

    if (error) {
      setFeedback(`Broadcast could not be sent: ${error.message}`);
    } else {
      const sentAt = data?.created_at ? new Date(data.created_at).toLocaleString() : new Date().toLocaleString();
      setFeedback(`Broadcast sent to ${area.trim()} at ${sentAt}.`);
      setTitle("");
      setMessage("");
      setArea("");
      setInstructions("");
      setPriority("High");
    }

    setIsSending(false);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: "Emergency Broadcast" }} />
      <SectionTitle
        title="Create Emergency Broadcast"
        subtitle="Send a clear emergency message to users in a selected target area."
      />

      {feedback ? (
        <Card accentColor={feedback.startsWith("Broadcast sent") ? COLORS.success : COLORS.warning}>
          <Text style={styles.feedback}>{feedback}</Text>
        </Card>
      ) : null}

      <Card accentColor={ROLE_COLORS.admin.main} style={styles.infoCard}>
        <Text style={styles.infoText}>Broadcasts are saved to the shared alerts table so Organization Staff and Community Reporters see the same update.</Text>
      </Card>

      <FormInput label="Broadcast title" required value={title} onChangeText={setTitle} placeholder="Example: Flood Warning" />
      <FormInput label="Message" required value={message} onChangeText={setMessage} multiline placeholder="Describe what users need to know." />
      <FormInput label="Target area" required value={area} onChangeText={setArea} placeholder="Example: Scarborough" />

      <Text style={styles.label}>Priority</Text>
      {priorities.map((option) => (
        <SelectOption key={option} label={option} selected={priority === option} onPress={() => setPriority(option)} compact />
      ))}

      <FormInput label="Safety instructions" value={instructions} onChangeText={setInstructions} multiline placeholder="Example: Avoid flooded roads and move to higher ground." />
      <AppButton title="Send Broadcast" onPress={sendBroadcast} variant="danger" loading={isSending} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  feedback: { color: COLORS.text, fontSize: FONT_SIZE.sm, lineHeight: 20, fontWeight: "700" },
  infoCard: { backgroundColor: ROLE_COLORS.admin.light },
  infoText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, lineHeight: 20 },
  label: { color: COLORS.text, fontSize: FONT_SIZE.sm, fontWeight: "800", marginBottom: SPACING.sm },
});
