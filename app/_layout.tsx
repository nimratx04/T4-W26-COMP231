import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "../context/AppContext";
import { COLORS } from "../constants/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: COLORS.surface },
            headerTintColor: COLORS.text,
            headerTitleStyle: { fontWeight: "800" },
            contentStyle: { backgroundColor: COLORS.background },
          }}
        >
          {/* EXPLICITLY DECLARE YOUR ROUTES HERE */}
          <Stack.Screen name="index" options={{ title: "RescueBridge" }} />
          <Stack.Screen name="reporters" options={{ title: "Reporter Dashboard" }} />
          <Stack.Screen name="volunteer" options={{ title: "Volunteer" }} />
          <Stack.Screen name="affected" options={{ title: "Affected" }} />
          <Stack.Screen name="organization" options={{ title: "Organization" }} />
          <Stack.Screen name="admin" options={{ title: "Admin" }} />
        </Stack>
      </AppProvider>
    </SafeAreaProvider>
  );
}