import React, { useMemo, useState } from "react";
import { Search, Clock, ShieldAlert, Radio } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { GatewaySnapshot, HistoryItem } from "../types";

interface HistoryViewProps {
  snapshot?: GatewaySnapshot;
  history?: HistoryItem[];
}

export function HistoryView({ snapshot, history }: HistoryViewProps) {
  const [query, setQuery] = useState("");

  const records = useMemo(() => {
    const list = snapshot?.history || history || [];
    const q = query.toLowerCase().trim();
    if (!q) return list;
    return list.filter((item) =>
      `${item.title} ${item.detail} ${item.type}`.toLowerCase().includes(q)
    );
  }, [query, snapshot?.history, history]);

  const violationCount = records.filter((item) => item.type === "violation").length;

  return (
    <div className="space-y-4 pb-8">
      {/* Summary Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-[#D7E4F0] custom-shadow">
          <div className="text-2xl sm:text-3xl font-extrabold text-[#123047]">{records.length}</div>
          <div className="text-xs text-[#5C6E80] mt-1 font-medium">Records</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#D7E4F0] custom-shadow">
          <div className="text-2xl sm:text-3xl font-extrabold text-[#123047]">{violationCount}</div>
          <div className="text-xs text-[#5C6E80] mt-1 font-medium">Violations</div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5C6E80]">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Search logs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-12 pl-10 pr-4 bg-white border border-[#D7E4F0] rounded-xl text-sm text-[#123047] placeholder-[#9AA8B5] focus:outline-none focus:border-[#0B63CE] custom-shadow transition-colors"
        />
      </div>

      {/* History Log Stream */}
      <div className="bg-white rounded-2xl border border-[#D7E4F0] custom-shadow overflow-hidden">
        {records.length === 0 ? (
          <EmptyState
            icon="time-outline"
            title="No history yet"
            message="Buoy status changes and geofence events will be stored here after the gateway starts sending data."
          />
        ) : (
          <div className="divide-y divide-[#D7E4F0]">
            {records.map((item) => (
              <div key={item.id} className="p-4 hover:bg-[#F7FBFE] transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-sm text-[#123047] flex items-center gap-2">
                    {item.type === "violation" ? (
                      <ShieldAlert className="w-4 h-4 text-[#DC3D3D] shrink-0" />
                    ) : item.type === "gateway" ? (
                      <Radio className="w-4 h-4 text-[#0B63CE] shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-[#5C6E80] shrink-0" />
                    )}
                    {item.title}
                  </h4>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#EEF5FB] text-[#0B63CE]">
                    {item.type}
                  </span>
                </div>
                <p className="text-xs text-[#5C6E80] mt-1 leading-relaxed">{item.detail}</p>
                <div className="text-xs text-[#0B63CE] font-semibold mt-2">{item.time}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
