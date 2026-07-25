import type { PropsWithChildren } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SPACING } from "../constants/theme";

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}>;

export default function Screen({
  children,
  scroll = true,
  style,
  contentContainerStyle,
}: ScreenProps) {
  if (!scroll) {
    return (
      <SafeAreaView edges={["left", "right", "bottom"]} style={[styles.safeArea, style]}>
        <View style={[styles.content, styles.flex, contentContainerStyle]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={[styles.safeArea, style]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
});
