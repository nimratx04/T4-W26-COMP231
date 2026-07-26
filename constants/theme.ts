import { Platform } from "react-native";

export const COLORS = {
  primary: "#1565C0",
  primaryDark: "#0D47A1",
  primaryLight: "#E3F2FD",
  emergency: "#C62828",
  emergencyDark: "#8E0000",
  emergencyLight: "#FFEBEE",
  success: "#2E7D32",
  successLight: "#E8F5E9",
  warning: "#ED6C02",
  warningLight: "#FFF4E5",
  info: "#0277BD",
  infoLight: "#E1F5FE",
  background: "#F4F6F8",
  surface: "#FFFFFF",
  surfaceMuted: "#F8FAFC",
  text: "#1F2937",
  textSecondary: "#5F6B7A",
  textMuted: "#84909C",
  border: "#D7DEE5",
  borderStrong: "#AEB8C2",
  white: "#FFFFFF",
  black: "#000000",
  disabled: "#C5CDD5",
  disabledBackground: "#E8EDF2",
  overlay: "rgba(15, 23, 42, 0.45)",
} as const;

export const ROLE_COLORS = {
  affected: { main: "#C62828", light: "#FFEBEE" },
  organization: { main: "#2E7D32", light: "#E8F5E9" },
  volunteer: { main: "#1565C0", light: "#E3F2FD" },
  admin: { main: "#5E35B1", light: "#EDE7F6" },
  reporter: { main: "#EF6C00", light: "#FFF3E0" },
} as const;

export const STATUS_STYLES = {
  pending: { background: "#FFF4E5", text: "#9A4D00", border: "#FFCC80" },
  active: { background: "#E3F2FD", text: "#0D47A1", border: "#90CAF9" },
  resolved: { background: "#E8F5E9", text: "#1B5E20", border: "#A5D6A7" },
  verified: { background: "#E8F5E9", text: "#1B5E20", border: "#81C784" },
  rejected: { background: "#FFEBEE", text: "#B71C1C", border: "#EF9A9A" },
  expired: { background: "#ECEFF1", text: "#455A64", border: "#B0BEC5" },
  urgent: { background: "#FFEBEE", text: "#B71C1C", border: "#EF5350" },
  high: { background: "#FFF0F0", text: "#A61B1B", border: "#F2A1A1" },
  medium: { background: "#FFF4E5", text: "#9A4D00", border: "#FFCC80" },
  low: { background: "#E8F5E9", text: "#1B5E20", border: "#A5D6A7" },
  open: { background: "#E8F5E9", text: "#1B5E20", border: "#81C784" },
  limited: { background: "#FFF4E5", text: "#9A4D00", border: "#FFB74D" },
  full: { background: "#FFEBEE", text: "#B71C1C", border: "#EF9A9A" },
  closed: { background: "#ECEFF1", text: "#455A64", border: "#B0BEC5" },
  available: { background: "#E1F5FE", text: "#01579B", border: "#81D4FA" },
  accepted: { background: "#EDE7F6", text: "#4527A0", border: "#B39DDB" },
  completed: { background: "#E8F5E9", text: "#1B5E20", border: "#81C784" },
  responding: { background: "#E3F2FD", text: "#0D47A1", border: "#90CAF9" },
  pendingVerification: { background: "#FFF4E5", text: "#9A4D00", border: "#FFCC80" },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  round: 999,
} as const;

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 34,
} as const;

export const SHADOWS = {
  card:
    Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      default: {},
    }) ?? {},
  raised:
    Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: { elevation: 5 },
      default: {},
    }) ?? {},
} as const;

export type StatusTone = keyof typeof STATUS_STYLES;
