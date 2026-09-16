import { api } from "@/lib/api";
import type { GatewaySnapshot } from "@/lib/iot/types";

const emptySnapshot: GatewaySnapshot = {
  connected: false,
  lastHeardAt: null,
  buoys: [],
  alerts: [],
  history: [],
};

/**
 * Reads the live snapshot from SQLite through the local API.
 * The LoRa gateway will POST packets to /api/packets; this function only reads.
 */
export async function fetchIotSnapshot(): Promise<GatewaySnapshot> {
  try {
    return await api<GatewaySnapshot>("/api/snapshot");
  } catch {
    return emptySnapshot;
  }
}
