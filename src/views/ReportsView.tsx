import React, { useState } from "react";
import { FileText, Printer } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { GatewaySnapshot } from "../types";

interface ReportsViewProps {
  snapshot?: GatewaySnapshot;
  onOpenSimulator?: () => void;
  officerName?: string;
}

export function ReportsView({ snapshot, onOpenSimulator, officerName }: ReportsViewProps) {
  const [reportGenerated, setReportGenerated] = useState(false);
  const buoys = snapshot?.buoys || [];
  const alerts = snapshot?.alerts || [];
  const history = snapshot?.history || [];
  const hasData = history.length > 0 || alerts.length > 0 || buoys.length > 0;
  const todaysViolations = history.filter((item) => item.type === "violation").length;

  const handleGenerate = () => {
    if (!hasData) {
      alert("Reports need live buoy data. Connect the IoT model or simulate a LoRa packet first.");
      return;
    }
    setReportGenerated(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-[#D7E4F0] custom-shadow">
          <div className="text-2xl sm:text-3xl font-extrabold text-[#123047]">
            {history.length}
          </div>
          <div className="text-xs text-[#5C6E80] mt-1 font-medium">Logged events</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#D7E4F0] custom-shadow">
          <div className="text-2xl sm:text-3xl font-extrabold text-[#123047]">{todaysViolations}</div>
          <div className="text-xs text-[#5C6E80] mt-1 font-medium">Violations</div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-2xl p-5 border border-[#D7E4F0] custom-shadow">
        {hasData ? (
          <div className="space-y-3">
            <h3 className="font-bold text-base text-[#123047]">Summary</h3>
            <div className="grid grid-cols-3 gap-2 py-1">
              <div className="bg-[#F7FBFE] p-3 rounded-xl border border-[#D7E4F0]">
                <div className="text-xs text-[#5C6E80]">Alerts</div>
                <div className="text-xl font-extrabold text-[#123047] mt-1">
                  {alerts.length}
                </div>
              </div>
              <div className="bg-[#F7FBFE] p-3 rounded-xl border border-[#D7E4F0]">
                <div className="text-xs text-[#5C6E80]">Buoys</div>
                <div className="text-xl font-extrabold text-[#123047] mt-1">
                  {buoys.length}
                </div>
              </div>
              <div className="bg-[#F7FBFE] p-3 rounded-xl border border-[#D7E4F0]">
                <div className="text-xs text-[#5C6E80]">History</div>
                <div className="text-xl font-extrabold text-[#123047] mt-1">
                  {history.length}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            icon="bar-chart-outline"
            title="No report data"
            message="Charts and exports will use the same LoRa events as Monitor and History. Nothing to summarize yet."
          />
        )}
      </div>

      {/* Generate Report Button */}
      <button
        type="button"
        onClick={handleGenerate}
        className="w-full h-12 bg-[#0B63CE] hover:bg-[#084A9B] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm custom-shadow"
      >
        <FileText className="w-4 h-4" />
        Generate report
      </button>

      {/* Generated Report Preview Area */}
      {reportGenerated && (
        <div className="bg-white rounded-2xl p-6 border border-[#D7E4F0] custom-shadow space-y-4 print:p-0 print:border-none">
          <div className="flex items-center justify-between border-b border-[#D7E4F0] pb-3">
            <div>
              <h4 className="font-bold text-base text-[#123047]">
                Coastal Station Official Incident & Buoy Report
              </h4>
              <p className="text-xs text-[#5C6E80] mt-0.5">
                Generated: {new Date().toLocaleString()} • LGU Fisheries & Aquatic Resources
              </p>
            </div>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#EEF5FB] hover:bg-[#D7E4F0] text-[#0B63CE] font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors print:hidden"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / PDF
            </button>
          </div>

          <div className="space-y-3 text-xs text-[#123047]">
            <div className="font-semibold text-[#5C6E80] uppercase tracking-wider text-[11px]">
              Active Perimeter Buoy Status
            </div>
            <table className="w-full text-left border border-[#D7E4F0] rounded-lg overflow-hidden">
              <thead className="bg-[#F7FBFE] text-[#5C6E80]">
                <tr>
                  <th className="p-2">Buoy ID</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Battery</th>
                  <th className="p-2">GPS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D7E4F0]">
                {buoys.map((b) => (
                  <tr key={b.id}>
                    <td className="p-2 font-mono">{b.id}</td>
                    <td className="p-2 font-medium">{b.name}</td>
                    <td className="p-2 uppercase font-bold text-[10px]">{b.status}</td>
                    <td className="p-2">{b.battery}%</td>
                    <td className="p-2 font-mono">
                      {b.latitude != null ? `${b.latitude.toFixed(4)}, ${b.longitude?.toFixed(4)}` : "None"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 text-xs text-[#123047] pt-2">
            <div className="font-semibold text-[#5C6E80] uppercase tracking-wider text-[11px]">
              Geofence Infractions & Critical Alerts ({alerts.length})
            </div>
            {alerts.length === 0 ? (
              <p className="text-xs text-[#5C6E80] italic">No active violations or warnings on record.</p>
            ) : (
              <div className="space-y-1.5">
                {alerts.map((a) => (
                  <div key={a.id} className="p-2.5 bg-[#F7FBFE] rounded-lg border border-[#D7E4F0]">
                    <div className="font-bold flex items-center justify-between">
                      <span>{a.title} ({a.buoy || "Station"})</span>
                      <span className="uppercase text-[10px] font-bold">{a.status}</span>
                    </div>
                    <p className="text-[#5C6E80] mt-0.5">{a.detail}</p>
                    <div className="text-[10px] text-[#8A9AAB] mt-1">{a.time}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
