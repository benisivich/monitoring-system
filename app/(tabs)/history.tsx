import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { Palette, cardShadow } from "@/constants/theme";
import { useIotSnapshot } from "@/hooks/use-iot-snapshot";

export default function HistoryScreen() {
  const { snapshot } = useIotSnapshot();
  const [query, setQuery] = useState("");

  const records = useMemo(() => {
    const q = query.toLowerCase();
    return snapshot.history.filter((item) => `${item.title} ${item.detail}`.toLowerCase().includes(q));
  }, [query, snapshot.history]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{records.length}</Text>
          <Text style={styles.summaryLabel}>Records</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {records.filter((item) => item.type === "violation").length}
          </Text>
          <Text style={styles.summaryLabel}>Violations</Text>
        </View>
      </View>

      <View style={styles.search}>
        <Ionicons name="search" size={18} color={Palette.muted} />
        <TextInput
          placeholder="Search logs"
          placeholderTextColor="#9AA8B5"
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <View style={styles.card}>
        {records.length === 0 ? (
          <EmptyState
            icon="time-outline"
            title="No history yet"
            message="Buoy status changes and geofence events will be stored here after the gateway starts sending data."
          />
        ) : (
          records.map((item) => (
            <View key={item.id} style={styles.logRow}>
              <Text style={styles.logTitle}>{item.title}</Text>
              <Text style={styles.logDetail}>{item.detail}</Text>
              <Text style={styles.logTime}>{item.time}</Text>
            </View>
          ))
        )}
      </View>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background, padding: 18 },
  summaryRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  summaryCard: { flex: 1, backgroundColor: Palette.card, borderRadius: 16, padding: 16, ...cardShadow },
  summaryValue: { fontSize: 28, fontWeight: "800", color: Palette.text },
  summaryLabel: { color: Palette.muted, marginTop: 4 },
  search: {
    backgroundColor: Palette.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    ...cardShadow,
  },
  searchInput: { flex: 1, fontSize: 15, color: Palette.text },
  card: { backgroundColor: Palette.card, borderRadius: 16, ...cardShadow },
  logRow: { padding: 14, borderBottomWidth: 1, borderBottomColor: Palette.border },
  logTitle: { fontWeight: "700", color: Palette.text },
  logDetail: { color: Palette.muted, marginTop: 4 },
  logTime: { color: Palette.primary, marginTop: 6, fontSize: 12, fontWeight: "600" },
});
