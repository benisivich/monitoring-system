import React, { useState } from "react";
import { CheckCircle, CheckCircle2, RefreshCw, Radio } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { api } from "../api";
import { GatewaySnapshot, AlertStatus, AlertItem } from "../types";

interface AlertsViewProps {
  snapshot?: GatewaySnapshot;
  alerts?: AlertItem[];
  onRefresh?: () => void;
  loading?: boolean;
  onOpenSimulator?: () => void;
  onUpdateStatus?: (id: string, status: AlertStatus) => Promise<void> | void;
}

export function AlertsView({
  snapshot,
  alerts,
  onRefresh,
  loading,
  onOpenSimulator,
  onUpdateStatus,
}: AlertsViewProps) {
  const alertsList = snapshot?.alerts || alerts || [];
  const active = alertsList.filter((item) => item.status === "active");
  const [selectedId, setSelectedId] = useState<string | undefined>(() => alertsList[0]?.id);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selected = alertsList.find((item) => item.id === selectedId) ?? alertsList[0];

  const updateStatus = async (status: AlertStatus) => {
    if (!selected) {
      alert("No alert selected to update.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      if (onUpdateStatus) {
        await onUpdateStatus(selected.id, status);
      } else {
        await api(`/api/alerts/${selected.id}`, { method: "PATCH", body: { status } });
      }
      setMessage(`Alert updated to "${status}".`);
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      alert(err.message || "Could not update alert status.");
    } finally {
      setBusy(false);
    }
  };

  const isConnected = snapshot?.connected ?? true;

  return (
    <div className="space-y-4 pb-8">
      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-[#D7E4F0] custom-shadow">
          <div className="text-2xl sm:text-3xl font-extrabold text-[#123047]">{active.length}</div>
          <div className="text-xs text-[#5C6E80] mt-1 font-medium">Active alerts</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#D7E4F0] custom-shadow">
          <div className="text-2xl sm:text-3xl font-extrabold text-[#123047]">
            {isConnected ? "On" : "Off"}
          </div>
          <div className="text-xs text-[#5C6E80] mt-1 font-medium">Gateway</div>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage(null)} className="text-emerald-700 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Alerts Card List */}
      <div className="bg-white rounded-2xl border border-[#D7E4F0] custom-shadow overflow-hidden">
        <div className="p-4 border-b border-[#D7E4F0] flex items-center justify-between">
          <h3 className="font-bold text-base text-[#123047]">Alerts Stream</h3>
          <span className="text-xs text-[#5C6E80]">
            {selected ? `Selected: #${selected.id}` : "Select an alert"}
          </span>
        </div>

        {alertsList.length === 0 ? (
          <EmptyState
            icon="notifications-off-outline"
            title="No alerts"
            message="Alerts are stored in the database when a buoy packet is posted to the gateway."
          />
        ) : (
          <div className="divide-y divide-[#D7E4F0]">
            {alertsList.map((item) => {
              const isSelected = (selected?.id ?? "") === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected ? "bg-[#E8F2FC]" : "hover:bg-[#F7FBFE]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-[#123047] flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.status === "active"
                            ? "bg-[#DC3D3D]"
                            : item.status === "acknowledged"
                            ? "bg-[#D97706]"
                            : "bg-[#1E9E58]"
                        }`}
                      />
                      {item.title}
                    </h4>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        item.status === "active"
                          ? "bg-red-100 text-red-700"
                          : item.status === "acknowledged"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#5C6E80] mt-1.5 leading-relaxed">{item.detail}</p>
                  <div className="text-[11px] text-[#8A9AAB] mt-2 font-medium flex items-center gap-2">
                    {item.buoy && <span className="text-[#0B63CE] font-bold">{item.buoy}</span>}
                    <span>•</span>
                    <span>{item.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-1">
        <button
          type="button"
          disabled={busy || !selected}
          onClick={() => void updateStatus("acknowledged")}
          className="w-full h-12 bg-[#0B63CE] hover:bg-[#084A9B] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-40 text-sm shadow-sm"
        >
          <CheckCircle className="w-4 h-4" />
          Acknowledge
        </button>

        <button
          type="button"
          disabled={busy || !selected}
          onClick={() => void updateStatus("resolved")}
          className="w-full h-12 bg-[#0B63CE] hover:bg-[#084A9B] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-40 text-sm shadow-sm"
        >
          <CheckCircle2 className="w-4 h-4" />
          Mark resolved
        </button>

        <div className="flex items-center justify-between pt-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="text-sm font-bold text-[#0B63CE] hover:underline flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh alerts
            </button>
          )}

          {onOpenSimulator && (
            <button
              type="button"
              onClick={onOpenSimulator}
              className="text-xs font-semibold text-[#5C6E80] hover:text-[#0B63CE] flex items-center gap-1 ml-auto"
            >
              <Radio className="w-3.5 h-3.5" />
              Trigger Test Alert
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
