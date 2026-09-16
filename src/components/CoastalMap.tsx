import React, { useState } from "react";
import { Navigation, Battery, Radio } from "lucide-react";
import { Buoy } from "../types";

interface CoastalMapProps {
  buoys: Buoy[];
  onSelectBuoy?: (buoy: Buoy) => void;
  onOpenSimulator?: () => void;
}

export function CoastalMap({ buoys, onSelectBuoy, onOpenSimulator }: CoastalMapProps) {
  const [selectedBuoy, setSelectedBuoy] = useState<Buoy | null>(null);

  // Reference bounding box around Iligan Bay / coastal coordinates (Lat: 8.20 to 8.26, Lon: 124.22 to 124.28)
  const minLat = 8.21;
  const maxLat = 8.25;
  const minLng = 124.22;
  const maxLng = 124.27;

  // Convert GPS to SVG percentages
  const getCoordinates = (lat: number | null, lng: number | null, index: number) => {
    if (lat == null || lng == null) {
      // Fallback distribution along the boundary line if coordinates null
      return { x: 30 + index * 20, y: 40 + (index % 2) * 20 };
    }
    const x = Math.max(10, Math.min(90, ((lng - minLng) / (maxLng - minLng)) * 80 + 10));
    // Invert Y because latitude goes north (up) but SVG Y goes down
    const y = Math.max(10, Math.min(90, 100 - (((lat - minLat) / (maxLat - minLat)) * 80 + 10)));
    return { x, y };
  };

  const validBuoys = buoys.filter((b) => b.latitude != null && b.longitude != null);

  return (
    <div className="w-full">
      <div className="relative w-full h-80 sm:h-96 rounded-xl overflow-hidden bg-gradient-to-b from-[#0A4F8A] to-[#083b68] border border-[#D7E4F0] custom-shadow">
        {/* Coastal Grid & Water Effect */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            </pattern>
            {/* Coastal Coastline curve */}
            <linearGradient id="landGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e4431" />
              <stop offset="100%" stopColor="#143224" />
            </linearGradient>
            <linearGradient id="geofenceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(220, 61, 61, 0.18)" />
              <stop offset="100%" stopColor="rgba(220, 61, 61, 0.04)" />
            </linearGradient>
          </defs>

          {/* Grid pattern */}
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Simulated Coastline Landmass (Left / Shore) */}
          <path
            d="M 0 0 L 120 0 Q 150 120 90 200 Q 60 260 110 380 L 0 380 Z"
            fill="url(#landGrad)"
            stroke="rgba(244, 230, 200, 0.3)"
            strokeWidth="3"
          />

          {/* Coastal Shoreline label */}
          <text x="25" y="60" fill="rgba(255,255,255,0.4)" fontSize="11" fontWeight="700" letterSpacing="1">
            SHORELINE
          </text>
          <text x="25" y="76" fill="rgba(255,255,255,0.25)" fontSize="9">
            Monitoring Base
          </text>

          {/* Restricted Geofence Boundary Polygon */}
          <polygon
            points="180,50 340,60 380,240 220,270 160,180"
            fill="url(#geofenceGrad)"
            stroke="#DC3D3D"
            strokeWidth="2"
            strokeDasharray="6 4"
          />

          {/* Geofence Zone Label */}
          <text x="230" y="160" fill="rgba(220, 61, 61, 0.85)" fontSize="12" fontWeight="700" letterSpacing="0.5">
            RESTRICTED MARINE ZONE
          </text>
          <text x="248" y="178" fill="rgba(255,255,255,0.4)" fontSize="10">
            Geofence Perimeter
          </text>

          {/* Buoy interconnecting LoRa mesh boundary line */}
          {validBuoys.length > 1 && (
            <polyline
              points={validBuoys
                .map((b, i) => {
                  const pt = getCoordinates(b.latitude, b.longitude, i);
                  return `${pt.x}%,${pt.y}%`;
                })
                .join(" ")}
              fill="none"
              stroke="rgba(11, 99, 206, 0.6)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          )}
        </svg>

        {/* Buoy Markers */}
        {validBuoys.map((buoy, idx) => {
          const pt = getCoordinates(buoy.latitude, buoy.longitude, idx);
          const isSelected = selectedBuoy?.id === buoy.id;
          const statusBg =
            buoy.status === "online"
              ? "bg-[#1E9E58] ring-[#1E9E58]/40"
              : buoy.status === "warning"
              ? "bg-[#D97706] ring-[#D97706]/40"
              : "bg-[#DC3D3D] ring-[#DC3D3D]/40";

          return (
            <div
              key={buoy.id}
              style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
              onClick={() => {
                setSelectedBuoy(buoy);
                if (onSelectBuoy) onSelectBuoy(buoy);
              }}
            >
              {/* Pulse animation for active buoys */}
              {buoy.status === "online" && (
                <span className="absolute -inset-2 rounded-full bg-[#1E9E58]/30 animate-ping opacity-75" />
              )}

              {/* Marker pin */}
              <div
                className={`relative flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-xs ring-4 transition-transform duration-200 group-hover:scale-110 shadow-lg ${statusBg} ${
                  isSelected ? "ring-white scale-125" : ""
                }`}
              >
                <Radio className="w-4 h-4" />
              </div>

              {/* Tag Label */}
              <div className="absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/75 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 shadow pointer-events-none">
                <span>{buoy.name}</span>
                <span className="opacity-75">{buoy.battery}%</span>
              </div>
            </div>
          );
        })}

        {/* Empty state overlay when no buoys yet */}
        {validBuoys.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/20 backdrop-blur-[2px]">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
              <Navigation className="w-6 h-6 text-[#90CAF9] animate-pulse" />
            </div>
            <p className="text-white font-bold text-base">Awaiting LoRa GPS Coordinates</p>
            <p className="text-[#E4F0FB] text-xs max-w-xs mt-1 leading-relaxed">
              Buoy coordinates will be mapped when LoRa packets are forwarded to <code className="bg-black/30 px-1 py-0.5 rounded text-amber-300">/api/packets</code>.
            </p>
            {onOpenSimulator && (
              <button
                type="button"
                onClick={onOpenSimulator}
                className="mt-4 px-3.5 py-1.5 bg-[#0B63CE] hover:bg-[#084A9B] text-white text-xs font-bold rounded-lg transition-colors shadow-md flex items-center gap-1.5"
              >
                <Radio className="w-3.5 h-3.5" />
                Simulate LoRa Packet
              </button>
            )}
          </div>
        )}

        {/* Map Legend Overlay */}
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md rounded-lg p-2 text-[10px] text-white space-y-1 border border-white/10 pointer-events-none">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[9px] text-blue-200">
            Map Legend
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#1E9E58]" /> Online Buoy
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D97706]" /> Low Battery / Warning
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#DC3D3D]" /> Offline
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#DC3D3D]" /> Geofence Boundary
          </div>
        </div>

        {/* Map Coordinates readout */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md rounded-lg px-2.5 py-1 text-[11px] font-mono text-white/90 border border-white/10 pointer-events-none">
          Target Area: 8.228° N, 124.245° E
        </div>
      </div>

      {/* Selected Buoy Drawer Details */}
      {selectedBuoy && (
        <div className="mt-3 p-3.5 bg-white rounded-xl border border-[#D7E4F0] custom-shadow flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-3 h-3 rounded-full ${
                selectedBuoy.status === "online"
                  ? "bg-[#1E9E58]"
                  : selectedBuoy.status === "warning"
                  ? "bg-[#D97706]"
                  : "bg-[#DC3D3D]"
              }`}
            />
            <div>
              <div className="font-bold text-[#123047] text-sm flex items-center gap-2">
                <span>{selectedBuoy.name}</span>
                <span className="text-xs font-mono text-[#5C6E80] font-normal">({selectedBuoy.id})</span>
              </div>
              <div className="text-xs text-[#5C6E80] font-mono">
                Lat: {selectedBuoy.latitude?.toFixed(4) ?? "N/A"} • Lon: {selectedBuoy.longitude?.toFixed(4) ?? "N/A"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#5C6E80]">
            <span className="flex items-center gap-1 bg-[#EEF5FB] px-2.5 py-1 rounded-md">
              <Battery className="w-3.5 h-3.5 text-[#0B63CE]" />
              {selectedBuoy.battery}% battery
            </span>
            <span className="bg-[#EEF5FB] px-2.5 py-1 rounded-md">
              Last Ping: <strong className="text-[#123047]">{selectedBuoy.lastPing}</strong>
            </span>
            <button
              type="button"
              onClick={() => setSelectedBuoy(null)}
              className="text-xs text-[#5C6E80] hover:text-[#123047] underline ml-1"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
