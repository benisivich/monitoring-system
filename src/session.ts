import { Personnel } from "./types";

const TOKEN_KEY = "coastal_session_token";
const USER_KEY = "coastal_session_user";

export function getSessionToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function setSession(token: string, user: Personnel | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch {
    // ignore
  }
}

export function getPersonnel(): Personnel | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setPersonnel(user: Personnel | null) {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch {
    // ignore
  }
}

export function getSignedInUser(): string {
  const p = getPersonnel();
  return p?.displayName || p?.username || "";
}

export function clearSignedInUser() {
  setSession("", null);
}
