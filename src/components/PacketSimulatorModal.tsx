import React, { useState } from "react";
import { X, Radio, Activity, Send, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { ingestLoraPacket, sendGatewayHeartbeat } from "../services/coastalFirebase";
import { Buoy } from "../types";

interface PacketSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  buoys?: Buoy[];
}

export function PacketSimulatorModal({ isOpen, onClose }: PacketSimulatorModalProps) {
  const [deviceId, setDeviceId] = useState("BUOY-01");
  const [name, setName] = useState("Buoy 01");
  const [latitude, setLatitude] = useState("8.2280");
  const [longitude, setLongitude] = useState("124.2450");
  const [battery, setBattery] = useState("87");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  if (!isOpen) return null;

  const presets = [
    {
      label: "Buoy 01 (Healthy)",
      id: "BUOY-01",
      name: "Buoy 01",
      lat: "8.2280",
      lon: "124.2450",
      bat: "87",
    },
    {
      label: "Buoy 02 (Low Battery Alert)",
      id: "BUOY-02",
      name: "Buoy 02",
      lat: "8.2355",
      lon: "124.2520",
      bat: "18",
    },
    {
      label: "Buoy 03 (North Reef)",
      id: "BUOY-03",
      name: "Buoy 03",
      lat: "8.2420",
      lon: "124.2380",
      bat: "94",
    },
    {
      label: "Buoy 04 (South Boundary)",
      id: "BUOY-04",
      name: "Buoy 04",
      lat: "8.2190",
      lon: "124.2580",
      bat: "65",
    },
  ];

  const applyPreset = (p: typeof presets[0]) => {
    setDeviceId(p.id);
    setName(p.name);
    setLatitude(p.lat);
    setLongitude(p.lon);
    setBattery(p.bat);
    setMessage(null);
  };

  const handleSendPacket = async () => {
    if (!deviceId.trim()) {
      setMessage({ text: "Device ID is required", success: false });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await ingestLoraPacket({
        deviceId: deviceId.trim(),
        name: name.trim() || deviceId.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        battery: parseInt(battery, 10),
      });

      setMessage({
        text: `LoRa packet written directly to Cloud Firestore! Real-time listeners updated.`,
        success: true,
      });
    } catch (err: any) {
      console.error("LoRa packet ingestion error:", err);
      setMessage({ text: err.message || "Failed to ingest packet into Firestore", success: false });
    } finally {
      setBusy(false);
    }
  };

  const handleSendHeartbeat = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await sendGatewayHeartbeat();
      setMessage({ text: "Gateway heartbeat recorded to Firestore!", success: true });
    } catch (err: any) {
      console.error("Gateway heartbeat error:", err);
      setMessage({ text: err.message || "Heartbeat failed", success: false });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full custom-shadow-lg border border-[#D7E4F0] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#0B63CE] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-emerald-300 animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">LoRa Gateway Ingestion Simulator</h3>
                <span className="flex items-center gap-1 text-[10px] bg-white/20 text-white px-2 py-0.5 rounded font-mono font-medium">
                  <ShieldCheck className="w-3 h-3 text-emerald-300" />
                  Firestore Live
                </span>
              </div>
              <p className="text-xs text-[#E4F0FB]">
                Streams ESP32 radio packets directly into Cloud Firestore collections
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-bold text-[#5C6E80] uppercase tracking-wider mb-2">
              Quick Test Presets
            </label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="px-3 py-2 text-left rounded-lg border border-[#D7E4F0] hover:border-[#0B63CE] hover:bg-[#E8F2FC] transition-colors text-xs"
                >
                  <div className="font-semibold text-[#123047]">{p.label}</div>
                  <div className="text-[10px] text-[#5C6E80]">
                    {p.bat}% bat • {p.lat}, {p.lon}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#123047] mb-1">Device ID</label>
              <input
                type="text"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="w-full h-10 px-3 border border-[#D7E4F0] rounded-lg bg-[#F7FBFE] text-[#123047] text-sm focus:outline-none focus:border-[#0B63CE]"
                placeholder="e.g. BUOY-01"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#123047] mb-1">Buoy Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 border border-[#D7E4F0] rounded-lg bg-[#F7FBFE] text-[#123047] text-sm focus:outline-none focus:border-[#0B63CE]"
                placeholder="e.g. Buoy 01"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#123047] mb-1">Latitude</label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full h-10 px-3 border border-[#D7E4F0] rounded-lg bg-[#F7FBFE] text-[#123047] text-sm focus:outline-none focus:border-[#0B63CE]"
                placeholder="8.228"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#123047] mb-1">Longitude</label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full h-10 px-3 border border-[#D7E4F0] rounded-lg bg-[#F7FBFE] text-[#123047] text-sm focus:outline-none focus:border-[#0B63CE]"
                placeholder="124.245"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#123047] mb-1">Battery (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={battery}
                onChange={(e) => setBattery(e.target.value)}
                className="w-full h-10 px-3 border border-[#D7E4F0] rounded-lg bg-[#F7FBFE] text-[#123047] text-sm focus:outline-none focus:border-[#0B63CE]"
                placeholder="87"
              />
            </div>
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 text-xs font-medium ${
                message.success
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              disabled={busy}
              onClick={handleSendPacket}
              className="flex-1 h-11 bg-[#0B63CE] hover:bg-[#084A9B] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {busy ? "Writing to Firestore..." : "Post LoRa Packet"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleSendHeartbeat}
              className="h-11 px-4 border border-[#D7E4F0] hover:bg-[#EEF5FB] text-[#123047] font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors text-xs"
              title="Touch gateway heartbeat in Firestore"
            >
              <Activity className="w-4 h-4 text-[#1E9E58]" />
              Heartbeat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
