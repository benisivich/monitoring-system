import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Palette, cardShadow } from "@/constants/theme";
import { api } from "@/lib/api";
import { clearSignedInUser, getPersonnel, getSignedInUser } from "@/lib/session";

export default function ProfileScreen() {
  const person = getPersonnel();
  const username = person?.displayName || getSignedInUser() || "Officer";

  const logout = () => {
    Alert.alert("Sign out", "Return to the sign-in screen?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          void api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
          clearSignedInUser();
          router.replace("/");
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={36} color="#fff" />
        </View>
        <Text style={styles.name}>{username}</Text>
        <Text style={styles.role}>{person?.employeeId || "Personnel account"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.note}>
          This profile is saved in the SQLite database on the API computer.
        </Text>
        <Menu icon="person-circle-outline" title="Edit profile" onPress={() => router.push("/edit-profile")} />
        <Menu icon="lock-closed-outline" title="Change password" onPress={() => router.push("/change-password")} />
        <Menu icon="shield-checkmark-outline" title="Security" onPress={() => router.push("/security")} />
        <Menu icon="log-out-outline" title="Sign out" color={Palette.danger} onPress={logout} />
      </View>
    </ScrollView>
  );
}

function Menu({
  icon,
  title,
  onPress,
  color = Palette.text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.menuText, { color }]}>{title}</Text>
      <Ionicons name="chevron-forward" size={18} color="#9AA8B5" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background },
  hero: {
    backgroundColor: Palette.primary,
    paddingVertical: 28,
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  name: { fontSize: 22, fontWeight: "800", color: "#fff" },
  role: { color: "#EAF4FF", marginTop: 4 },
  card: { backgroundColor: Palette.card, margin: 18, padding: 16, borderRadius: 18, ...cardShadow },
  note: { color: Palette.muted, lineHeight: 20, marginBottom: 8 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  menuText: { flex: 1, marginLeft: 12, fontSize: 15 },
});
