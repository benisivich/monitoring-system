import { StyleSheet, Text, View } from "react-native";

import { Palette } from "@/constants/theme";

export default function AboutModal() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Coastal Geofencing Monitoring System</Text>
      <Text style={styles.copy}>
        The app is the phone console. Buoy data will arrive through lib/iot/gateway.ts after the LoRa model is assembled.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: Palette.text,
    marginBottom: 12,
  },
  copy: {
    color: Palette.muted,
    lineHeight: 22,
    fontSize: 16,
  },
});
