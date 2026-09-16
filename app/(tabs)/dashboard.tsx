import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { Palette, cardShadow } from "@/constants/theme";
import { useIotSnapshot } from "@/hooks/use-iot-snapshot";

export default function Dashboard() {
  const { snapshot, activeBuoys, activeAlerts, todaysViolations } = useIotSnapshot();
  const recentAlerts = snapshot.alerts.slice(0, 3);

  const stats = [
    { title: "Active Buoys", value: String(activeBuoys), icon: "radio-outline", color: Palette.success },
    { title: "Active Alerts", value: String(activeAlerts), icon: "notifications-outline", color: Palette.danger },
    { title: "Gateway", value: snapshot.connected ? "On" : "Off", icon: "wifi-outline", color: Palette.primary },
    { title: "Violations", value: String(todaysViolations), icon: "warning-outline", color: Palette.warning },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View>
          <Text style={styles.kicker}>Coastal monitoring</Text>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>
            Counts stay at zero until the LoRa gateway writes packets into the database.
          </Text>
        </View>
        <View style={[styles.pill, snapshot.connected ? styles.pillOn : styles.pillOff]}>
          <Text style={[styles.pillText, snapshot.connected ? styles.pillOnText : styles.pillOffText]}>
            {snapshot.connected ? "GATEWAY ON" : "WAITING"}
          </Text>
        </View>
      </View>

      <View style={styles.cardGrid}>
        {stats.map((item) => (
          <View key={item.title} style={styles.statCard}>
            <Ionicons name={item.icon as never} size={22} color={item.color} />
            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statTitle}>{item.title}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Quick access</Text>
      <View style={styles.quickRow}>
        <QuickButton title="Monitor" icon="map-outline" screen="/(tabs)/monitor" />
        <QuickButton title="Alerts" icon="notifications-outline" screen="/(tabs)/alerts" />
        <QuickButton title="History" icon="time-outline" screen="/(tabs)/history" />
        <QuickButton title="Reports" icon="bar-chart-outline" screen="/(tabs)/reports" />
      </View>

      <Text style={styles.sectionTitle}>Recent alerts</Text>
      {recentAlerts.length === 0 ? (
        <View style={styles.card}>
          <EmptyState
            icon="notifications-off-outline"
            title="No alerts yet"
            message="Geofence alerts will appear here when a buoy reports a restricted-area event."
          />
        </View>
      ) : (
        recentAlerts.map((alert) => (
          <View key={alert.id} style={styles.alertCard}>
            <Text style={styles.alertTitle}>{alert.title}</Text>
            <Text style={styles.alertText}>
              {alert.buoy} • {alert.time}
            </Text>
          </View>
        ))
      )}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

function QuickButton({
  title,
  icon,
  screen,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen: string;
}) {
  return (
    <TouchableOpacity style={styles.quickButton} onPress={() => router.push(screen as never)}>
      <Ionicons name={icon} size={20} color={Palette.primary} />
      <Text style={styles.quickText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background, padding: 18 },
  hero: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  kicker: { color: Palette.primary, fontWeight: "700", fontSize: 12, textTransform: "uppercase" },
  title: { fontSize: 24, fontWeight: "800", color: Palette.text, marginTop: 4 },
  subtitle: { color: Palette.muted, marginTop: 4, flexShrink: 1, paddingRight: 12 },
  pill: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  pillOn: { backgroundColor: "#E8F8EE" },
  pillOff: { backgroundColor: "#FDECEC" },
  pillText: { fontWeight: "800", fontSize: 11 },
  pillOnText: { color: Palette.success },
  pillOffText: { color: Palette.danger },
  cardGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  statCard: {
    width: "48%",
    backgroundColor: Palette.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    ...cardShadow,
  },
  statValue: { fontSize: 26, fontWeight: "800", color: Palette.text, marginTop: 8 },
  statTitle: { marginTop: 4, color: Palette.muted },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: Palette.text, marginBottom: 12, marginTop: 8 },
  quickRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  quickButton: {
    backgroundColor: Palette.card,
    width: "23%",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    ...cardShadow,
  },
  quickText: { fontSize: 11, marginTop: 8, fontWeight: "600", color: Palette.text },
  card: { backgroundColor: Palette.card, borderRadius: 16, ...cardShadow },
  alertCard: {
    backgroundColor: Palette.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    ...cardShadow,
  },
  alertTitle: { fontWeight: "700", color: Palette.text },
  alertText: { color: Palette.muted, marginTop: 4 },
});
