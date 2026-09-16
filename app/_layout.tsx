import { Stack } from "expo-router";
import { DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { Palette } from "@/constants/theme";

export const unstable_settings = {
  initialRouteName: "index",
};

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Palette.primary,
    background: Palette.background,
    card: Palette.card,
    text: Palette.text,
    border: Palette.border,
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={AppTheme}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Palette.primary },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700" },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="edit-profile" options={{ title: "Edit Profile" }} />
        <Stack.Screen name="change-password" options={{ title: "Change Password" }} />
        <Stack.Screen name="security" options={{ title: "Security" }} />
        <Stack.Screen name="modal" options={{ presentation: "modal", title: "About" }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
