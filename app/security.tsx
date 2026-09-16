import { useEffect, useState } from "react";
import { Alert, StyleSheet, Switch, Text, View } from "react-native";

import { Palette, cardShadow } from "@/constants/theme";
import { api } from "@/lib/api";

type SecurityState = {
  sessionLock: boolean;
  confirmAlerts: boolean;
  auditTrail: boolean;
};

export default function Security() {
  const [settings, setSettings] = useState<SecurityState>({
    sessionLock: false,
    confirmAlerts: false,
    auditTrail: false,
  });

  useEffect(() => {
    void api<{ security: SecurityState }>("/api/me")
      .then((data) => setSettings(data.security))
      .catch(() => undefined);
  }, []);

  const save = async (next: SecurityState) => {
    setSettings(next);
    try {
      await api("/api/me/security", { method: "PATCH", body: next });
    } catch (error) {
      Alert.alert("Could not save", error instanceof Error ? error.message : "Database API is offline.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Station security</Text>
        <Text style={styles.copy}>These switches are stored per user in the security_settings table.</Text>
        <Row
          title="Auto lock after idle"
          detail="Require sign-in after 5 minutes of inactivity."
          value={settings.sessionLock}
          onValueChange={(sessionLock) => void save({ ...settings, sessionLock })}
        />
        <Row
          title="Confirm alert actions"
          detail="Ask before acknowledging or resolving a geofence alert."
          value={settings.confirmAlerts}
          onValueChange={(confirmAlerts) => void save({ ...settings, confirmAlerts })}
        />
        <Row
          title="Keep audit trail"
          detail="Store officer actions for weekly LGU reporting."
          value={settings.auditTrail}
          onValueChange={(auditTrail) => void save({ ...settings, auditTrail })}
        />
      </View>
    </View>
  );
}

function Row({
  title,
  detail,
  value,
  onValueChange,
}: {
  title: string;
  detail: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDetail}>{detail}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: Palette.primary }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background, padding: 18 },
  card: { backgroundColor: Palette.card, borderRadius: 18, padding: 18, ...cardShadow },
  title: { fontSize: 18, fontWeight: "700", color: Palette.text },
  copy: { color: Palette.muted, marginTop: 6, marginBottom: 8, lineHeight: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  rowTitle: { fontWeight: "700", color: Palette.text },
  rowDetail: { color: Palette.muted, marginTop: 4, fontSize: 13, lineHeight: 18 },
});
