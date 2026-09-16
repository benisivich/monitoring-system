import React from "react";
import { X, Info, Navigation, Radio, Cpu, Flame } from "lucide-react";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full custom-shadow-lg border border-[#D7E4F0] overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-[#0B63CE] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            <h3 className="font-bold text-base">About the System</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-sm text-[#123047]">
          <div className="flex items-center gap-3 p-3 bg-[#EEF5FB] rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-[#0B63CE] flex items-center justify-center text-white shrink-0">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-base text-[#123047]">Coastal Geofence</div>
              <div className="text-xs text-[#5C6E80]">Marine Protected Area & Buoy Tracking</div>
            </div>
          </div>

          <div className="space-y-2 text-xs leading-relaxed text-[#5C6E80]">
            <p>
              This system protects coastal marine reserves and monitors marine perimeter boundary buoys via long-range (LoRa) radio telemetry and Cloud Firestore.
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-start gap-3 p-2.5 rounded-xl border border-[#D7E4F0]">
              <Flame className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-[#123047] block">Firebase Cloud Firestore & Auth</strong>
                <span className="text-[#5C6E80]">
                  Real-time document synchronization for buoys, alerts, event history, and officer authentication.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl border border-[#D7E4F0]">
              <Radio className="w-4 h-4 text-[#1E9E58] shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-[#123047] block">LoRa Gateway Protocol</strong>
                <span className="text-[#5C6E80]">
                  ESP32 radio telemetry packets captured and saved into the Firestore telemetry stream.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl border border-[#D7E4F0]">
              <Cpu className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-[#123047] block">Autonomous Geofencing</strong>
                <span className="text-[#5C6E80]">
                  Real-time violation detection when vessels cross coordinate perimeters or buoy batteries drop below threshold.
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 bg-[#0B63CE] hover:bg-[#084A9B] text-white font-bold rounded-xl transition-colors text-sm mt-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
