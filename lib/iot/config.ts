import Constants from "expo-constants";

export function getApiBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
  if (fromEnv) {
    return fromEnv;
  }

  const hostUri = Constants.expoConfig?.hostUri ?? "";
  const host = hostUri.replace(/^[a-z]+:\/\//i, "").split("/")[0].split(":")[0];

  if (host && host !== "localhost" && host !== "127.0.0.1") {
    return `http://${host}:3001`;
  }

  return "http://127.0.0.1:3001";
}
