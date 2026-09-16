import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Palette, cardShadow } from "@/constants/theme";
import { api } from "@/lib/api";

export default function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const save = async () => {
    if (!current || !next || !confirm) {
      Alert.alert("Incomplete", "Fill in all password fields.");
      return;
    }
    if (next !== confirm) {
      Alert.alert("Mismatch", "New password and confirmation do not match.");
      return;
    }
    try {
      await api("/api/me/password", {
        method: "PATCH",
        body: { currentPassword: current, newPassword: next },
      });
      setCurrent("");
      setNext("");
      setConfirm("");
      Alert.alert("Updated", "The new password is stored in the database.");
    } catch (error) {
      Alert.alert("Could not update", error instanceof Error ? error.message : "Database API is offline.");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.copy}>Passwords are hashed and saved in the users table. They are not stored as plain text.</Text>
        <Text style={styles.label}>Current password</Text>
        <TextInput style={styles.input} secureTextEntry value={current} onChangeText={setCurrent} />
        <Text style={styles.label}>New password</Text>
        <TextInput style={styles.input} secureTextEntry value={next} onChangeText={setNext} />
        <Text style={styles.label}>Confirm new password</Text>
        <TextInput style={styles.input} secureTextEntry value={confirm} onChangeText={setConfirm} />
        <TouchableOpacity style={styles.button} onPress={() => void save()}>
          <Text style={styles.buttonText}>Update password</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background },
  content: { padding: 18 },
  card: { backgroundColor: Palette.card, borderRadius: 18, padding: 18, ...cardShadow },
  copy: { color: Palette.muted, marginBottom: 16, lineHeight: 20 },
  label: { fontWeight: "600", color: Palette.text, marginBottom: 8 },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 14,
    backgroundColor: "#F7FBFE",
  },
  button: {
    height: 50,
    backgroundColor: Palette.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
});
