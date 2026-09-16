import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Palette } from "@/constants/theme";

export function EmptyState({
  icon,
  title,
  message,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
}) {
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={42} color="#90CAF9" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
  title: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "700",
    color: Palette.text,
    textAlign: "center",
  },
  message: {
    marginTop: 6,
    color: Palette.muted,
    textAlign: "center",
    lineHeight: 20,
  },
});
