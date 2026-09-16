import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  addDoc,
} from "firebase/firestore";
import {
  User,
} from "firebase/auth";
import { auth, db } from "../firebase";
import {
  AlertItem,
  Buoy,
  BuoyPacket,
  GatewaySnapshot,
  HistoryItem,
  Personnel,
  SecurityState,
} from "../types";

// Standardize email login format from username or email
export function formatEmail(input: string): string {
  const trimmed = input.trim();
  if (trimmed.includes("@")) {
    return trimmed;
  }
  // If user entered just a username, synthesize email domain for Firebase Auth
  const sanitized = trimmed.toLowerCase().replace(/[^a-z0-9._-]/g, "");
  return `${sanitized || "officer"}@coastal-geofence.local`;
}

export function usernameFromEmail(email: string): string {
  if (!email) return "officer";
  if (email.endsWith("@coastal-geofence.local")) {
    return email.replace("@coastal-geofence.local", "");
  }
  return email.split("@")[0] || email;
}

// Map Firestore document to Buoy
export function mapBuoyDoc(id: string, data: any): Buoy {
  let status = data.status || "online";
  if (data.lastPing) {
    const diff = Date.now() - new Date(data.lastPing).getTime();
    if (diff > 5 * 60 * 1000) {
      status = "offline";
    }
  }
  return {
    id,
    name: data.name || id,
    status,
    battery: typeof data.battery === "number" ? data.battery : 100,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    lastPing: data.lastPing || new Date().toISOString(),
  };
}

// Initial simulated buoys, alerts, and telemetry for instant test access
const defaultTestBuoys: Buoy[] = [
  {
    id: "B01",
    name: "North Passage Buoy",
    status: "online",
    battery: 96,
    latitude: 14.5824,
    longitude: 120.9741,
    lastPing: new Date().toISOString(),
  },
  {
    id: "B02",
    name: "Harbor Entrance Beacon",
    status: "online",
    battery: 84,
    latitude: 14.5689,
    longitude: 120.9587,
    lastPing: new Date().toISOString(),
  },
  {
    id: "B03",
    name: "Coral Reef Sentinel",
    status: "online",
    battery: 72,
    latitude: 14.5512,
    longitude: 120.9419,
    lastPing: new Date().toISOString(),
  },
  {
    id: "B04",
    name: "South Shoal Marker",
    status: "warning",
    battery: 16,
    latitude: 14.5385,
    longitude: 120.9652,
    lastPing: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  },
];

const defaultTestAlerts: AlertItem[] = [
  {
    id: "alt-01",
    buoy: "B04",
    title: "Low battery warning",
    detail: "South Shoal Marker reported battery at 16%. Solar cell cleaning or battery check advised.",
    severity: "warning",
    status: "active",
    time: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: "alt-02",
    buoy: "B02",
    title: "Geofence proximity notice",
    detail: "Unidentified vessel proximity detected near commercial shipping lane buffer.",
    severity: "danger",
    status: "active",
    time: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
  },
];

const defaultTestHistory: HistoryItem[] = [
  {
    id: "hist-01",
    type: "gateway",
    title: "Gateway station synced",
    detail: "LoRa base station receiving telemetry across 4 buoys with nominal RSSI.",
    time: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: "hist-02",
    type: "status",
    title: "Telemetry packet ingested",
    detail: "North Passage Buoy (B01) confirmed GPS lock and 96% battery reserve.",
    time: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
  },
  {
    id: "hist-03",
    type: "alert",
    title: "Threshold advisory",
    detail: "Low battery alert created for South Shoal Marker (B04).",
    time: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
];

// Reactive in-memory test cache
let inMemoryGateway = { connected: true, lastHeardAt: new Date().toISOString() };
let inMemoryBuoys: Buoy[] = [...defaultTestBuoys];
let inMemoryAlerts: AlertItem[] = [...defaultTestAlerts];
let inMemoryHistory: HistoryItem[] = [...defaultTestHistory];
const activeListeners: ((snapshot: GatewaySnapshot) => void)[] = [];

function notifyActiveListeners() {
  const snapshot: GatewaySnapshot = {
    connected: inMemoryGateway.connected,
    lastHeardAt: inMemoryGateway.lastHeardAt,
    buoys: [...inMemoryBuoys],
    alerts: [...inMemoryAlerts],
    history: [...inMemoryHistory],
  };
  for (const listener of activeListeners) {
    try {
      listener(snapshot);
    } catch (e) {
      console.warn("Listener notification note:", e);
    }
  }
}

// Create quick test officer profile
export function createTestOfficer(username = "duty_officer", displayName = "Duty Officer Cruz"): Personnel {
  return {
    uid: `test-${Date.now()}`,
    username,
    displayName,
    email: `${username}@coastal-geofence.local`,
    phone: "+1 (555) 019-2831",
    employeeId: "CG-8804",
    notes: "Operating in Instant Test Mode with full telemetry, packet simulator, and geofence tools.",
  };
}

// Real-time Subscriptions for Snapshot (with Firestore & seamless Test Fallback)
export function subscribeToGatewaySnapshot(
  callback: (snapshot: GatewaySnapshot) => void
): () => void {
  activeListeners.push(callback);

  let currentGateway = { ...inMemoryGateway };
  let currentBuoys: Buoy[] = [...inMemoryBuoys];
  let currentAlerts: AlertItem[] = [...inMemoryAlerts];
  let currentHistory: HistoryItem[] = [...inMemoryHistory];

  const emit = () => {
    // If Firestore has not populated yet, ensure test buoys remain visible
    const buoysToEmit = currentBuoys.length > 0 ? currentBuoys : inMemoryBuoys;
    const alertsToEmit = currentAlerts.length > 0 ? currentAlerts : inMemoryAlerts;
    const historyToEmit = currentHistory.length > 0 ? currentHistory : inMemoryHistory;

    callback({
      connected: currentGateway.connected,
      lastHeardAt: currentGateway.lastHeardAt,
      buoys: [...buoysToEmit],
      alerts: [...alertsToEmit],
      history: [...historyToEmit],
    });
  };

  // Immediately emit current data so the screen is never blank
  emit();

  // 1. Gateway Station doc from Firestore (if user is authenticated)
  let unsubGateway = () => {};
  try {
    unsubGateway = onSnapshot(
      doc(db, "gateway", "lora-main"),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          let connected = Boolean(data.connected);
          if (data.lastHeardAt) {
            const diff = Date.now() - new Date(data.lastHeardAt).getTime();
            if (diff > 2 * 60 * 1000) {
              connected = false;
            }
          }
          currentGateway = {
            connected,
            lastHeardAt: data.lastHeardAt || null,
          };
          inMemoryGateway = { ...currentGateway };
        }
        emit();
      },
      (err) => {
        // Fallback to test gateway gracefully
        emit();
      }
    );
  } catch {
    emit();
  }

  // 2. Buoys collection from Firestore
  let unsubBuoys = () => {};
  try {
    const buoysQuery = query(collection(db, "buoys"), orderBy("id", "asc"));
    unsubBuoys = onSnapshot(
      buoysQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          currentBuoys = snapshot.docs.map((docSnap) => mapBuoyDoc(docSnap.id, docSnap.data()));
          inMemoryBuoys = [...currentBuoys];
        }
        emit();
      },
      (err) => {
        emit();
      }
    );
  } catch {
    emit();
  }

  // 3. Alerts collection from Firestore (latest 50)
  let unsubAlerts = () => {};
  try {
    const alertsQuery = query(collection(db, "alerts"), orderBy("createdAt", "desc"), limit(50));
    unsubAlerts = onSnapshot(
      alertsQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          currentAlerts = snapshot.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              buoy: d.buoyId || "",
              title: d.title || "Alert",
              detail: d.detail || "",
              severity: d.severity || "warning",
              status: d.status || "active",
              time: d.createdAt || new Date().toISOString(),
            };
          });
          inMemoryAlerts = [...currentAlerts];
        }
        emit();
      },
      (err) => {
        emit();
      }
    );
  } catch {
    emit();
  }

  // 4. History collection from Firestore (latest 100)
  let unsubHistory = () => {};
  try {
    const historyQuery = query(collection(db, "history"), orderBy("createdAt", "desc"), limit(100));
    unsubHistory = onSnapshot(
      historyQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          currentHistory = snapshot.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              type: d.type || "status",
              title: d.title || "Event",
              detail: d.detail || "",
              time: d.createdAt || new Date().toISOString(),
            };
          });
          inMemoryHistory = [...currentHistory];
        }
        emit();
      },
      (err) => {
        emit();
      }
    );
  } catch {
    emit();
  }

  return () => {
    const idx = activeListeners.indexOf(callback);
    if (idx !== -1) activeListeners.splice(idx, 1);
    try {
      unsubGateway();
      unsubBuoys();
      unsubAlerts();
      unsubHistory();
    } catch {
      // ignore
    }
  };
}

// LoRa Telemetry Ingestion (Dual Firestore & Test Store)
export async function ingestLoraPacket(packet: BuoyPacket): Promise<void> {
  const now = new Date().toISOString();
  const deviceId = packet.deviceId.trim();
  const displayName = packet.name?.trim() || deviceId;
  const lat = packet.latitude !== undefined && packet.latitude !== null ? Number(packet.latitude) : null;
  const lng = packet.longitude !== undefined && packet.longitude !== null ? Number(packet.longitude) : null;
  const bat = packet.battery !== undefined && packet.battery !== null ? Math.round(Number(packet.battery)) : 100;

  let status: "online" | "warning" | "offline" = "online";
  if (bat < 20) {
    status = "warning";
  }

  // Always update in-memory test store so the UI reacts immediately
  inMemoryGateway = {
    connected: true,
    lastHeardAt: now,
  };

  const existingIdx = inMemoryBuoys.findIndex((b) => b.id.toLowerCase() === deviceId.toLowerCase());
  const updatedBuoy: Buoy = {
    id: deviceId,
    name: displayName,
    status,
    battery: bat,
    latitude: lat,
    longitude: lng,
    lastPing: now,
  };

  if (existingIdx >= 0) {
    inMemoryBuoys[existingIdx] = updatedBuoy;
  } else {
    inMemoryBuoys.push(updatedBuoy);
  }

  inMemoryHistory.unshift({
    id: `hist-${Date.now()}`,
    type: "status",
    title: "Packet received",
    detail: `${displayName} reported battery at ${bat}% via LoRa gateway.`,
    time: now,
  });

  if (bat < 20) {
    inMemoryAlerts.unshift({
      id: `alt-${Date.now()}`,
      buoy: deviceId,
      title: "Low battery warning",
      detail: `${displayName} reported critical battery level at ${bat}%.`,
      severity: "warning",
      status: "active",
      time: now,
    });
  }

  notifyActiveListeners();

  // If user is authenticated in Firebase, also sync to Cloud Firestore
  if (auth.currentUser) {
    try {
      await setDoc(
        doc(db, "gateway", "lora-main"),
        {
          name: "LoRa Gateway Station",
          connected: true,
          lastHeardAt: now,
        },
        { merge: true }
      );

      const buoyRef = doc(db, "buoys", deviceId);
      await setDoc(
        buoyRef,
        {
          id: deviceId,
          name: displayName,
          status,
          battery: bat,
          latitude: lat,
          longitude: lng,
          lastPing: now,
        },
        { merge: true }
      );

      await addDoc(collection(db, "packets"), {
        buoyId: deviceId,
        latitude: lat,
        longitude: lng,
        battery: bat,
        receivedAt: now,
      });

      if (bat < 20) {
        await addDoc(collection(db, "alerts"), {
          buoyId: deviceId,
          title: "Low battery warning",
          detail: `${displayName} reported battery at ${bat}%. Service or recharge recommended.`,
          severity: "warning",
          status: "active",
          createdAt: now,
        });
      }
    } catch (err) {
      console.warn("Firestore sync note (continuing with local state):", err);
    }
  }
}

// Update Alert Status (Dual Firestore & Test Store)
export async function updateAlertStatus(
  alertId: string,
  newStatus: "active" | "acknowledged" | "resolved"
): Promise<void> {
  const alert = inMemoryAlerts.find((a) => a.id === alertId);
  if (alert) {
    alert.status = newStatus;
    notifyActiveListeners();
  }

  if (auth.currentUser) {
    try {
      const alertRef = doc(db, "alerts", alertId);
      await updateDoc(alertRef, { status: newStatus });
    } catch (err) {
      console.warn("Firestore alert update note:", err);
    }
  }
}

// Gateway Heartbeat
export async function sendGatewayHeartbeat(): Promise<void> {
  const now = new Date().toISOString();
  inMemoryGateway = {
    connected: true,
    lastHeardAt: now,
  };
  inMemoryHistory.unshift({
    id: `hist-${Date.now()}`,
    type: "gateway",
    title: "Gateway heartbeat",
    detail: "LoRa gateway station refreshed online status.",
    time: now,
  });
  notifyActiveListeners();

  if (auth.currentUser) {
    try {
      await setDoc(
        doc(db, "gateway", "lora-main"),
        {
          name: "LoRa Gateway Station",
          connected: true,
          lastHeardAt: now,
        },
        { merge: true }
      );
    } catch (err) {
      console.warn("Firestore heartbeat note:", err);
    }
  }
}

// User Profile management with Firebase Auth & Firestore
export async function getUserProfile(user: User): Promise<Personnel> {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  const data = snap.exists() ? snap.data() : {};

  return {
    uid: user.uid,
    username: data.username || usernameFromEmail(user.email || ""),
    displayName: data.displayName || user.displayName || usernameFromEmail(user.email || ""),
    email: user.email || data.email || "",
    phone: data.phone || "",
    employeeId: data.employeeId || "",
    notes: data.notes || "",
  };
}

export async function saveUserProfile(
  uid: string,
  profile: Partial<Personnel>
): Promise<void> {
  const userRef = doc(db, "users", uid);
  await setDoc(
    userRef,
    {
      ...profile,
      uid,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  if (auth.currentUser && profile.displayName) {
    await updateProfile(auth.currentUser, {
      displayName: profile.displayName,
    });
  }
}

export async function getSecurityState(uid: string): Promise<SecurityState> {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    const d = snap.data();
    return {
      sessionLock: Boolean(d.sessionLock),
      confirmAlerts: Boolean(d.confirmAlerts),
      auditTrail: Boolean(d.auditTrail),
    };
  }
  return {
    sessionLock: false,
    confirmAlerts: false,
    auditTrail: false,
  };
}

export async function saveSecurityState(
  uid: string,
  state: SecurityState
): Promise<void> {
  const userRef = doc(db, "users", uid);
  await setDoc(
    userRef,
    {
      sessionLock: state.sessionLock,
      confirmAlerts: state.confirmAlerts,
      auditTrail: state.auditTrail,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}
