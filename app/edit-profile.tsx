import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { Palette, cardShadow } from "@/constants/theme";
import { api } from "@/lib/api";
import { getPersonnel, setPersonnel, type Personnel } from "@/lib/session";

export default function EditProfile() {
  const current = getPersonnel();
  const [displayName, setDisplayName] = useState(current?.displayName ?? "");
  const [email, setEmail] = useState(current?.email ?? "");
  const [phone, setPhone] = useState(current?.phone ?? "");
  const [employeeId, setEmployeeId] = useState(current?.employeeId ?? "");
  const [notes, setNotes] = useState(current?.notes ?? "");

  useEffect(() => {
    void api<{ user: Personnel }>("/api/me")
      .then((data) => {
        setPersonnel(data.user);
        setDisplayName(data.user.displayName);
        setEmail(data.user.email);
        setPhone(data.user.phone);
        setEmployeeId(data.user.employeeId);
        setNotes(data.user.notes);
      })
      .catch(() => undefined);
  }, []);

  const save = async () => {
    try {
      const data = await api<{ user: Personnel }>("/api/me", {
        method: "PATCH",
        body: { displayName, email, phone, employeeId, notes },
      });
      setPersonnel(data.user);
      Alert.alert("Saved", "Profile was written to the database.");
    } catch (error) {
      Alert.alert("Could not save", error instanceof Error ? error.message : "Database API is offline.");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.copy}>These fields are stored in the users table.</Text>
        <Text style={styles.label}>Display name</Text>
        <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="Name" />
        <Text style={styles.label}>Employee ID</Text>
        <TextInput style={styles.input} value={employeeId} onChangeText={setEmployeeId} placeholder="Optional" />
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Optional"
          autoCapitalize="none"
        />
        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Optional" />
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional"
          multiline
        />
        <TouchableOpacity style={styles.button} onPress={() => void save()}>
          <Text style={styles.buttonText}>Save</Text>
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
    minHeight: 50,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 14,
    backgroundColor: "#F7FBFE",
    color: Palette.text,
  },
  multiline: { height: 90, textAlignVertical: "top", paddingTop: 12 },
  button: {
    height: 50,
    backgroundColor: Palette.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
});
