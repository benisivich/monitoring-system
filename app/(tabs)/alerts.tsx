import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { Palette, cardShadow } from "@/constants/theme";
import { useIotSnapshot } from "@/hooks/use-iot-snapshot";
import { api } from "@/lib/api";
import type { AlertStatus } from "@/lib/iot/types";

export default function AlertsScreen() {
  const { snapshot, refresh } = useIotSnapshot();
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const active = snapshot.alerts.filter((item) => item.status === "active");
  const selected = snapshot.alerts.find((item) => item.id === selectedId) ?? snapshot.alerts[0];

  const updateStatus = async (status: AlertStatus) => {
    if (!selected) {
      Alert.alert("No alert", "Nothing to update until the gateway writes an alert into the database.");
      return;
    }
    try {
      await api(`/api/alerts/${selected.id}`, { method: "PATCH", body: { status } });
      await refresh();
    } catch (error) {
      Alert.alert("Could not update", error instanceof Error ? error.message : "Database API is offline.");
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{active.length}</Text>
          <Text style={styles.statLabel}>Active alerts</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{snapshot.connected ? "On" : "Off"}</Text>
          <Text style={styles.statLabel}>Gateway</Text>
        </View>
      </View>

      <View style={styles.card}>
        {snapshot.alerts.length === 0 ? (
          <EmptyState
            icon="notifications-off-outline"
            title="No alerts"
            message="Alerts are stored in the database when a buoy packet is posted to the API."
          />
        ) : (
          snapshot.alerts.map((item) => (
            <TouchableOpacity key={item.id} style={styles.alertRow} onPress={() => setSelectedId(item.id)}>
              <Text style={styles.alertTitle}>{item.title}</Text>
              <Text style={styles.alertDetail}>{item.detail}</Text>
              <Text style={styles.alertMeta}>
                {item.buoy} • {item.time} • {item.status}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={() => void updateStatus("acknowledged")}>
        <Ionicons name="checkmark-circle" size={18} color="#fff" />
        <Text style={styles.buttonText}>Acknowledge</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => void updateStatus("resolved")}>
        <Ionicons name="checkmark-done" size={18} color="#fff" />
        <Text style={styles.buttonText}>Mark resolved</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.ghost} onPress={() => void refresh()}>
        <Text style={styles.ghostText}>Refresh alerts</Text>
      </TouchableOpacity>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background, padding: 18 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: Palette.card, borderRadius: 16, padding: 14, ...cardShadow },
  statValue: { fontSize: 22, fontWeight: "800", color: Palette.text },
  statLabel: { marginTop: 4, color: Palette.muted, fontSize: 12 },
  card: { backgroundColor: Palette.card, borderRadius: 16, padding: 8, ...cardShadow },
  alertRow: { padding: 12, borderBottomWidth: 1, borderBottomColor: Palette.border },
  alertTitle: { fontWeight: "700", color: Palette.text },
  alertDetail: { color: Palette.muted, marginTop: 4 },
  alertMeta: { color: Palette.text, marginTop: 8, fontSize: 12 },
  button: {
    backgroundColor: Palette.primary,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  ghost: { padding: 14, alignItems: "center" },
  ghostText: { color: Palette.primary, fontWeight: "700" },
});
