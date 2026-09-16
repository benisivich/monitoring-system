import { Platform, ViewStyle } from "react-native";

export const Palette = {
  primary: "#0B63CE",
  primaryDark: "#084A9B",
  primarySoft: "#E8F2FC",
  background: "#EEF5FB",
  card: "#FFFFFF",
  text: "#123047",
  muted: "#5C6E80",
  border: "#D7E4F0",
  success: "#1E9E58",
  warning: "#D97706",
  danger: "#DC3D3D",
  ocean: "#0A4F8A",
  sand: "#F4E6C8",
};

export const Colors = {
  light: {
    text: Palette.text,
    background: Palette.background,
    tint: Palette.primary,
    icon: Palette.muted,
    tabIconDefault: Palette.muted,
    tabIconSelected: Palette.primary,
  },
  dark: {
    text: "#ECEDEE",
    background: "#0F1720",
    tint: "#fff",
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: "#fff",
  },
};

export const cardShadow: ViewStyle = {
  shadowColor: "#0B3A66",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
