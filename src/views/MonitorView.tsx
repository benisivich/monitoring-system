import React from "react";
import { Radio, Battery, Wifi, ShieldCheck } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { CoastalMap } from "../components/CoastalMap";
import { GatewaySnapshot, BuoyStatus } from "../types";

interface MonitorViewProps {
  snapshot?: GatewaySnapshot;
  onOpenSimulator: () => void;
}

const statusColors: Record<BuoyStatus, { dot: string; text: string }> = {
  online: { dot: "bg-[#1E9E58]", text: "text-[#1E9E58]" },
  warning: { dot: "bg-[#D97706]", text: "text-[#D97706]" },
  offline: { dot: "bg-[#DC3D3D]", text: "text-[#DC3D3D]" },
};

export function MonitorView({ snapshot, onOpenSimulator }: MonitorViewProps) {
  const buoys = snapshot?.buoys || [];
  const isConnected = snapshot?.connected ?? true;
  const lastHeardAt = snapshot?.lastHeardAt;

  return (
    <div className="space-y-4 pb-8">
      {/* LoRa Gateway Status Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D7E4F0] custom-shadow flex items-center justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-[#0B63CE]" />
            <h3 className="font-bold text-base text-[#123047]">LoRa gateway</h3>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Live Firestore Sync
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#5C6E80] mt-1 leading-relaxed">
            {isConnected
              ? `Connected • last packet ${lastHeardAt ?? "just now"}`
              : "Gateway waiting for incoming LoRa packet transmission."}
          </p>
        </div>
        <span
          className={`px-3 py-1.5 rounded-full text-xs font-extrabold tracking-wider ${
            isConnected ? "bg-[#1E9E58] text-white" : "bg-[#DC3D3D] text-white"
          }`}
        >
          {isConnected ? "ONLINE" : "OFFLINE"}
        </span>
      </div>

      {/* Map Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D7E4F0] custom-shadow space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-[#123047]">Sanctuary Perimeter & Buoy Tracking</h3>
          <span className="text-xs font-semibold text-[#0B63CE] bg-[#EEF5FB] px-2.5 py-1 rounded-md">
            {buoys.length} buoy location(s)
          </span>
        </div>
        <p className="text-xs sm:text-sm text-[#5C6E80] leading-relaxed">
          GPS coordinates stream dynamically from Cloud Firestore. Buoys update their coordinates and boundary positions without page refreshes.
        </p>

        {/* Interactive Map Visualizer */}
        <CoastalMap buoys={buoys} onOpenSimulator={onOpenSimulator} />
      </div>

      {/* Boundary Buoys Section */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-base font-bold text-[#123047]">Boundary buoys</h3>
          <span className="text-xs text-[#5C6E80]">
            {buoys.length} registered in Firestore
          </span>
        </div>

        {buoys.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#D7E4F0] custom-shadow">
            <EmptyState
              icon="radio-outline"
              title="No buoys yet"
              message="Each buoy will automatically register in Cloud Firestore after the LoRa gateway receives its first telemetry packet."
            />
          </div>
        ) : (
          <div className="space-y-2">
            {buoys.map((buoy) => {
              const statusCfg = statusColors[buoy.status] || statusColors.offline;
              return (
                <div
                  key={buoy.id}
                  className="bg-white rounded-xl p-3.5 border border-[#D7E4F0] custom-shadow flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${statusCfg.dot} shrink-0`} />
                    <div>
                      <div className="font-bold text-sm text-[#123047]">{buoy.name}</div>
                      <div className="text-xs text-[#5C6E80] flex items-center gap-1 mt-0.5">
                        <Battery className="w-3 h-3 text-[#0B63CE]" />
                        battery {buoy.battery}%
                        {buoy.latitude != null && buoy.longitude != null && (
                          <span className="hidden sm:inline font-mono text-[11px] text-[#8A9AAB] ml-2">
                            ({buoy.latitude.toFixed(4)}, {buoy.longitude.toFixed(4)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-[#5C6E80] font-medium">{buoy.lastPing}</div>
                    <div className={`text-[10px] font-extrabold uppercase mt-0.5 ${statusCfg.text}`}>
                      {buoy.status}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onOpenSimulator}
          className="w-full h-12 bg-white hover:bg-[#EEF5FB] border border-[#D7E4F0] text-[#0B63CE] font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm shadow-sm"
        >
          <Radio className="w-4 h-4" />
          Simulate LoRa Packet Ingestion
        </button>
      </div>
    </div>
  );
}
