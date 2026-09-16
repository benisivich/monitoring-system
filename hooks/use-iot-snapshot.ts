import { useCallback, useEffect, useState } from "react";

import { fetchIotSnapshot } from "@/lib/iot/gateway";
import type { GatewaySnapshot } from "@/lib/iot/types";

const emptySnapshot: GatewaySnapshot = {
  connected: false,
  lastHeardAt: null,
  buoys: [],
  alerts: [],
  history: [],
};

export function useIotSnapshot() {
  const [snapshot, setSnapshot] = useState<GatewaySnapshot>(emptySnapshot);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await fetchIotSnapshot();
      setSnapshot(next);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const activeBuoys = snapshot.buoys.filter((buoy) => buoy.status === "online").length;
  const activeAlerts = snapshot.alerts.filter((alert) => alert.status === "active").length;
  const todaysViolations = snapshot.history.filter((item) => item.type === "violation").length;

  return {
    snapshot,
    loading,
    refresh,
    activeBuoys,
    activeAlerts,
    todaysViolations,
  };
}
