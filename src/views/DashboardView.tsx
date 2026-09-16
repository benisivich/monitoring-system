import React from "react";
import { Radio, Bell, Wifi, AlertTriangle, Compass, Clock, BarChart3, ChevronRight, Activity, ShieldCheck } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { GatewaySnapshot, TabType } from "../types";

interface DashboardViewProps {
  snapshot: GatewaySnapshot;
  onSelectTab: (tab: TabType) => void;
  onOpenSimulator: () => void;
  onUpdateAlertStatus?: (id: string, status: "active" | "acknowledged" | "resolved") => void;
}

export function DashboardView({
  snapshot,
  onSelectTab,
  onOpenSimulator,
}: DashboardViewProps) {
  const buoys = snapshot?.buoys || [];
  const alerts = snapshot?.alerts || [];
  const history = snapshot?.history || [];
  const isConnected = snapshot?.connected ?? true;

  const activeBuoys = buoys.filter((b) => b.status === "online").length;
  const activeAlerts = alerts.filter((a) => a.status === "active").length;
  const todaysViolations = history.filter((h) => h.type === "violation").length;
  const recentAlerts = alerts.slice(0, 3);

  const stats = [
    {
      title: "Active Buoys",
      value: String(activeBuoys),
      icon: <Radio className="w-5 h-5 text-[#1E9E58]" />,
    },
    {
      title: "Active Alerts",
      value: String(activeAlerts),
      icon: <Bell className="w-5 h-5 text-[#DC3D3D]" />,
    },
    {
      title: "Gateway",
      value: isConnected ? "On" : "Off",
      icon: <Wifi className="w-5 h-5 text-[#0B63CE]" />,
    },
    {
      title: "Violations",
      value: String(todaysViolations),
      icon: <AlertTriangle className="w-5 h-5 text-[#D97706]" />,
    },
  ];

  return (
    <div className="space-y-5 pb-8">
      {/* Hero Section */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[#0B63CE] font-bold text-xs uppercase tracking-wider">
              Coastal monitoring
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Cloud Firestore Real-time
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#123047] mt-1">Dashboard</h2>
          <p className="text-sm text-[#5C6E80] mt-1 max-w-xl leading-relaxed">
            Live telemetry synchronized with Firebase Cloud Firestore. Radio packets from the LoRa gateway update markers and alerts instantly.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-extrabold tracking-wider ${
              snapshot.connected
                ? "bg-[#E8F8EE] text-[#1E9E58] border border-[#1E9E58]/20"
                : "bg-[#FDECEC] text-[#DC3D3D] border border-[#DC3D3D]/20"
            }`}
          >
            {snapshot.connected ? "GATEWAY ON" : "WAITING"}
          </div>
        </div>
      </div>

      {/* LoRa Link Indicator Banner */}
      {!snapshot.connected && (
        <div className="p-3.5 bg-white rounded-2xl border border-[#D7E4F0] custom-shadow flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-[#5C6E80]">
            <Activity className="w-4 h-4 text-[#D97706] animate-pulse" />
            <span>
              Gateway awaiting ESP32 packet transmission. Forwarded radio telemetry streams live into Cloud Firestore.
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenSimulator}
            className="px-3 py-1.5 bg-[#0B63CE] hover:bg-[#084A9B] text-white font-bold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Radio className="w-3.5 h-3.5" />
            Send Test Packet
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((item) => (
          <div
            key={item.title}
            className="bg-white p-4 rounded-2xl border border-[#D7E4F0] custom-shadow hover:border-[#0B63CE]/40 transition-colors"
          >
            <div>{item.icon}</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#123047] mt-2 tracking-tight">
              {item.value}
            </div>
            <div className="text-xs text-[#5C6E80] mt-1 font-medium">{item.title}</div>
          </div>
        ))}
      </div>

      {/* Quick Access Row */}
      <div>
        <h3 className="text-base font-bold text-[#123047] mb-2.5">Quick access</h3>
        <div className="grid grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => onSelectTab("monitor")}
            className="bg-white p-3 rounded-xl border border-[#D7E4F0] custom-shadow hover:border-[#0B63CE] hover:bg-[#EEF5FB] transition-colors flex flex-col items-center justify-center text-center"
          >
            <Compass className="w-5 h-5 text-[#0B63CE]" />
            <span className="text-xs font-semibold text-[#123047] mt-2">Monitor</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTab("alerts")}
            className="bg-white p-3 rounded-xl border border-[#D7E4F0] custom-shadow hover:border-[#0B63CE] hover:bg-[#EEF5FB] transition-colors flex flex-col items-center justify-center text-center"
          >
            <Bell className="w-5 h-5 text-[#0B63CE]" />
            <span className="text-xs font-semibold text-[#123047] mt-2">Alerts</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTab("history")}
            className="bg-white p-3 rounded-xl border border-[#D7E4F0] custom-shadow hover:border-[#0B63CE] hover:bg-[#EEF5FB] transition-colors flex flex-col items-center justify-center text-center"
          >
            <Clock className="w-5 h-5 text-[#0B63CE]" />
            <span className="text-xs font-semibold text-[#123047] mt-2">History</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTab("reports")}
            className="bg-white p-3 rounded-xl border border-[#D7E4F0] custom-shadow hover:border-[#0B63CE] hover:bg-[#EEF5FB] transition-colors flex flex-col items-center justify-center text-center"
          >
            <BarChart3 className="w-5 h-5 text-[#0B63CE]" />
            <span className="text-xs font-semibold text-[#123047] mt-2">Reports</span>
          </button>
        </div>
      </div>

      {/* Recent Alerts Section */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-base font-bold text-[#123047]">Recent alerts</h3>
          {alerts.length > 0 && (
            <button
              type="button"
              onClick={() => onSelectTab("alerts")}
              className="text-xs text-[#0B63CE] font-bold hover:underline flex items-center gap-0.5"
            >
              View all ({alerts.length})
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentAlerts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#D7E4F0] custom-shadow">
            <EmptyState
              icon="notifications-off-outline"
              title="No alerts yet"
              message="Geofence alerts will appear here in real-time when a buoy reports an incident or low battery."
            />
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => onSelectTab("alerts")}
                className="bg-white rounded-2xl p-4 border border-[#D7E4F0] custom-shadow hover:border-[#0B63CE] cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-[#123047] text-sm">{alert.title}</div>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      alert.status === "active"
                        ? "bg-red-100 text-red-700"
                        : alert.status === "acknowledged"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {alert.status}
                  </span>
                </div>
                <div className="text-xs text-[#5C6E80] mt-1">
                  {alert.buoy && <span className="font-medium text-[#123047]">{alert.buoy} • </span>}
                  {alert.time}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
