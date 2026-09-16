export type BuoyStatus = "online" | "warning" | "offline";
export type AlertSeverity = "critical" | "warning" | "info";
export type AlertStatus = "active" | "acknowledged" | "resolved";
export type HistoryType = "violation" | "status" | "gateway";

/** One LoRa packet from a boundary buoy. */
export type BuoyPacket = {
  deviceId: string;
  name?: string;
  latitude: number;
  longitude: number;
  battery: number;
  receivedAt: string;
};

export type Buoy = {
  id: string;
  name: string;
  status: BuoyStatus;
  battery: number;
  lastPing: string;
  latitude: number | null;
  longitude: number | null;
};

export type AlertItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  buoy: string;
  severity: AlertSeverity;
  status: AlertStatus;
};

export type HistoryItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  type: HistoryType;
};

export type GatewaySnapshot = {
  connected: boolean;
  lastHeardAt: string | null;
  buoys: Buoy[];
  alerts: AlertItem[];
  history: HistoryItem[];
};
