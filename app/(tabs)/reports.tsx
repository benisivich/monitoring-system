import { Ionicons } from "@expo/vector-icons";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { Palette, cardShadow } from "@/constants/theme";
import { useIotSnapshot } from "@/hooks/use-iot-snapshot";

export default function ReportsScreen() {
  const { snapshot, todaysViolations } = useIotSnapshot();
  const hasData = snapshot.history.length > 0 || snapshot.alerts.length > 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{snapshot.history.length}</Text>
          <Text style={styles.statLabel}>Logged events</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{todaysViolations}</Text>
          <Text style={styles.statLabel}>Violations</Text>
        </View>
      </View>

      <View style={styles.card}>
        {hasData ? (
          <>
            <Text style={styles.cardTitle}>Summary</Text>
            <Text style={styles.row}>Alerts: {snapshot.alerts.length}</Text>
            <Text style={styles.row}>Buoys: {snapshot.buoys.length}</Text>
            <Text style={styles.row}>History: {snapshot.history.length}</Text>
          </>
        ) : (
          <EmptyState
            icon="bar-chart-outline"
            title="No report data"
            message="Charts and exports will use the same LoRa events as Monitor and History. Nothing to summarize yet."
          />
        )}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          Alert.alert(
            "Reports",
            hasData
              ? "A report can be built from the current gateway snapshot."
              : "Reports need live buoy data. Connect the IoT model first."
          )
        }
      >
        <Ionicons name="document-text-outline" size={18} color="#fff" />
        <Text style={styles.buttonText}>Generate report</Text>
      </TouchableOpacity>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background, padding: 18 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: Palette.card, borderRadius: 16, padding: 16, ...cardShadow },
  statValue: { fontSize: 28, fontWeight: "800", color: Palette.text },
  statLabel: { color: Palette.muted, marginTop: 4 },
  card: { backgroundColor: Palette.card, borderRadius: 16, padding: 8, marginBottom: 14, ...cardShadow },
  cardTitle: { fontSize: 16, fontWeight: "700", color: Palette.text, padding: 8 },
  row: { color: Palette.text, paddingHorizontal: 8, paddingBottom: 8 },
  button: {
    backgroundColor: Palette.primary,
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
});
