import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Palette } from "@/constants/theme";
import { api } from "@/lib/api";
import type { Personnel } from "@/lib/session";
import { setSession } from "@/lib/session";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (mode: "login" | "register") => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Sign in", "Enter a username and password.");
      return;
    }

    setBusy(true);
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const result = await api<{ token: string; user: Personnel }>(path, {
        method: "POST",
        auth: false,
        body: { username, password },
      });
      setSession(result.token, result.user);
      router.replace("/(tabs)/dashboard");
    } catch (error) {
      Alert.alert(
        mode === "login" ? "Sign in failed" : "Could not create account",
        error instanceof Error
          ? `${error.message}\n\nStart the database API with npm run api, then try again.`
          : "Could not reach the database API."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.hero}>
        <View style={styles.logoMark}>
          <Ionicons name="navigate" size={36} color="#fff" />
        </View>
        <Text style={styles.brand}>Coastal Geofence</Text>
        <Text style={styles.brandSub}>Monitoring System</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sign in</Text>
        <Text style={styles.cardSubtitle}>
          Accounts are stored in the SQLite database. Create one the first time you open the app.
        </Text>

        <Text style={styles.label}>Username</Text>
        <TextInput
          placeholder="Username"
          placeholderTextColor="#9AA8B5"
          style={styles.input}
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          placeholder="Password"
          placeholderTextColor="#9AA8B5"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.button}
          disabled={busy}
          onPress={() => void submit("login")}
        >
          <Text style={styles.buttonText}>{busy ? "Please wait..." : "Sign in"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondary}
          disabled={busy}
          onPress={() => void submit("register")}
        >
          <Text style={styles.secondaryText}>Create account</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.ocean,
    padding: 22,
    justifyContent: "center",
  },
  hero: { alignItems: "center", marginBottom: 28 },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  brand: { color: "#fff", fontSize: 32, fontWeight: "800" },
  brandSub: { color: "#E4F0FB", fontSize: 18, marginTop: 2 },
  card: { backgroundColor: "#fff", borderRadius: 24, padding: 22 },
  cardTitle: { fontSize: 20, fontWeight: "700", color: Palette.text },
  cardSubtitle: { color: Palette.muted, marginTop: 6, marginBottom: 18, lineHeight: 20 },
  label: { color: Palette.text, fontWeight: "600", marginBottom: 8 },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
    backgroundColor: "#F7FBFE",
    fontSize: 16,
    color: Palette.text,
  },
  button: {
    height: 54,
    backgroundColor: Palette.primary,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
    marginTop: 4,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  secondary: { height: 48, justifyContent: "center", alignItems: "center" },
  secondaryText: { color: Palette.primary, fontWeight: "700" },
});
