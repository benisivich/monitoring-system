import React from "react";
import { LayoutGrid, Compass, Bell, Clock, BarChart3, User, Radio } from "lucide-react";
import { TabType } from "../types";

interface NavbarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  activeAlertsCount: number;
  officerName: string;
  onOpenSimulator: () => void;
}

export function Navbar({
  currentTab,
  onSelectTab,
  activeAlertsCount,
  officerName,
  onOpenSimulator,
}: NavbarProps) {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutGrid className="w-5 h-5" /> },
    { id: "monitor", label: "Monitor", icon: <Compass className="w-5 h-5" /> },
    {
      id: "alerts",
      label: "Alerts",
      icon: (
        <div className="relative">
          <Bell className="w-5 h-5" />
          {activeAlertsCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-[#DC3D3D] text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
              {activeAlertsCount}
            </span>
          )}
        </div>
      ),
    },
    { id: "history", label: "History", icon: <Clock className="w-5 h-5" /> },
    { id: "reports", label: "Reports", icon: <BarChart3 className="w-5 h-5" /> },
    { id: "profile", label: "Profile", icon: <User className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Top Header */}
      <header className="bg-[#0B63CE] text-white shadow-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight leading-none">
                Coastal Geofence
              </h1>
              <p className="text-[11px] text-[#E4F0FB] font-medium leading-tight mt-0.5">
                Monitoring System • LoRa Console
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Packet simulator button */}
            <button
              type="button"
              onClick={onOpenSimulator}
              title="Open LoRa Gateway Simulator"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-semibold text-white transition-colors"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">LoRa Test</span>
            </button>

            {/* Officer chip */}
            <button
              type="button"
              onClick={() => onSelectTab("profile")}
              className="flex items-center gap-2 pl-2 pr-3 py-1 bg-black/15 hover:bg-black/25 rounded-full text-xs transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[11px] font-bold">
                {officerName ? officerName.charAt(0).toUpperCase() : "O"}
              </div>
              <span className="font-medium max-w-[100px] truncate">{officerName || "Officer"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Bottom or Tab Bar */}
      <nav aria-label="Main Navigation" className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#D7E4F0] z-30 custom-shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-around h-16 px-2">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center h-full pt-1 pb-1 transition-colors ${
                  isActive ? "text-[#0B63CE] font-bold" : "text-[#8A9AAB] hover:text-[#5C6E80] font-medium"
                }`}
              >
                <div className="h-6 flex items-center justify-center">{tab.icon}</div>
                <span className="text-[11px] mt-1 whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
