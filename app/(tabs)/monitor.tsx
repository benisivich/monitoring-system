import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { Palette, cardShadow } from "@/constants/theme";
import { useIotSnapshot } from "@/hooks/use-iot-snapshot";
import type { BuoyStatus } from "@/lib/iot/types";

const statusColor: Record<BuoyStatus, string> = {
  online: Palette.success,
  warning: Palette.warning,
  offline: Palette.danger,
};

export default function MonitorScreen() {
  const { snapshot, refresh, loading } = useIotSnapshot();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.statusCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.statusTitle}>LoRa gateway</Text>
          <Text style={styles.statusSubtitle}>
            {snapshot.connected
              ? `Connected • last packet ${snapshot.lastHeardAt}`
              : "Not connected. Assemble the gateway, then tap Refresh."}
          </Text>
        </View>
        <View style={[styles.badge, snapshot.connected ? styles.online : styles.offline]}>
          <Text style={styles.badgeText}>{snapshot.connected ? "ONLINE" : "OFFLINE"}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Map</Text>
        <Text style={styles.hint}>
          Buoy GPS from LoRa packets will be plotted here. No points are shown until a buoy sends coordinates.
        </Text>
        <View style={styles.mapBox}>
          <Ionicons name="map-outline" size={42} color={Palette.primary} />
          <Text style={styles.mapText}>{snapshot.buoys.length} buoy location(s)</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Boundary buoys</Text>
      {snapshot.buoys.length === 0 ? (
        <View style={styles.card}>
          <EmptyState
            icon="radio-outline"
            title="No buoys yet"
            message="Each assembled buoy should appear in this list after the gateway forwards its first packet."
          />
        </View>
      ) : (
        snapshot.buoys.map((buoy) => (
          <View key={buoy.id} style={styles.buoyRow}>
            <View style={[styles.dot, { backgroundColor: statusColor[buoy.status] }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.buoyName}>{buoy.name}</Text>
              <Text style={styles.buoyMeta}>battery {buoy.battery}%</Text>
            </View>
            <Text style={styles.buoyPing}>{buoy.lastPing}</Text>
          </View>
        ))
      )}

      <TouchableOpacity style={styles.refreshButton} onPress={() => void refresh()}>
        <Ionicons name="refresh" size={18} color="#fff" />
        <Text style={styles.refreshText}>{loading ? "Checking..." : "Refresh"}</Text>
      </TouchableOpacity>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background, padding: 18 },
  statusCard: {
    backgroundColor: Palette.card,
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
    ...cardShadow,
  },
  statusTitle: { fontWeight: "700", fontSize: 16, color: Palette.text },
  statusSubtitle: { color: Palette.muted, marginTop: 4, lineHeight: 18 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  online: { backgroundColor: Palette.success },
  offline: { backgroundColor: Palette.danger },
  badgeText: { color: "#fff", fontWeight: "800", fontSize: 11 },
  card: { backgroundColor: Palette.card, borderRadius: 16, padding: 16, marginBottom: 14, ...cardShadow },
  cardTitle: { fontWeight: "700", fontSize: 16, color: Palette.text },
  hint: { color: Palette.muted, marginTop: 6, lineHeight: 20 },
  mapBox: {
    height: 180,
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: Palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  mapText: { marginTop: 8, color: Palette.primary, fontWeight: "600" },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: Palette.text, marginBottom: 10 },
  buoyRow: {
    backgroundColor: Palette.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    ...cardShadow,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  buoyName: { fontWeight: "700", color: Palette.text },
  buoyMeta: { color: Palette.muted, marginTop: 2, fontSize: 12 },
  buoyPing: { color: Palette.muted, fontSize: 12 },
  refreshButton: {
    backgroundColor: Palette.primary,
    marginTop: 10,
    padding: 16,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  refreshText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
