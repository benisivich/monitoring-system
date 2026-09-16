import React from "react";
import { User, Lock, Shield, LogOut, ChevronRight, Info, ShieldCheck } from "lucide-react";
import { Personnel } from "../types";

interface ProfileViewProps {
  person: Personnel | null;
  onOpenEditProfile: () => void;
  onOpenChangePassword: () => void;
  onOpenSecurity: () => void;
  onOpenAbout: () => void;
  onLogout: () => void;
}

export function ProfileView({
  person,
  onOpenEditProfile,
  onOpenChangePassword,
  onOpenSecurity,
  onOpenAbout,
  onLogout,
}: ProfileViewProps) {
  const username = person?.displayName || person?.username || "Officer";

  const handleLogout = () => {
    onLogout();
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Hero Avatar Card */}
      <div className="bg-[#0B63CE] text-white rounded-3xl py-8 px-6 flex flex-col items-center justify-center text-center shadow-md">
        <div className="w-18 h-18 rounded-full bg-white/20 flex items-center justify-center mb-3 shadow-inner">
          <User className="w-9 h-9 text-white" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight">{username}</h2>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-[#EAF4FF] font-medium">
            {person?.employeeId ? `ID: ${person.employeeId}` : person?.email || "Personnel account"}
          </p>
          <span className="inline-flex items-center gap-1 text-[10px] bg-white/15 px-2 py-0.5 rounded-full font-mono text-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-300" />
            Firebase Auth
          </span>
        </div>
      </div>

      {/* Menu Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#D7E4F0] custom-shadow">
        <p className="text-xs text-[#5C6E80] leading-relaxed mb-3">
          Personnel credentials and preferences are securely managed in Cloud Firestore and Firebase Authentication.
        </p>

        <div className="divide-y divide-[#D7E4F0]">
          <button
            type="button"
            onClick={onOpenEditProfile}
            className="w-full py-3.5 flex items-center justify-between text-left hover:bg-[#F7FBFE] transition-colors rounded-lg px-2"
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-[#0B63CE]" />
              <span className="text-sm font-semibold text-[#123047]">Edit profile</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9AA8B5]" />
          </button>

          <button
            type="button"
            onClick={onOpenChangePassword}
            className="w-full py-3.5 flex items-center justify-between text-left hover:bg-[#F7FBFE] transition-colors rounded-lg px-2"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-[#0B63CE]" />
              <span className="text-sm font-semibold text-[#123047]">Change password</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9AA8B5]" />
          </button>

          <button
            type="button"
            onClick={onOpenSecurity}
            className="w-full py-3.5 flex items-center justify-between text-left hover:bg-[#F7FBFE] transition-colors rounded-lg px-2"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-[#0B63CE]" />
              <span className="text-sm font-semibold text-[#123047]">Security settings</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9AA8B5]" />
          </button>

          <button
            type="button"
            onClick={onOpenAbout}
            className="w-full py-3.5 flex items-center justify-between text-left hover:bg-[#F7FBFE] transition-colors rounded-lg px-2"
          >
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-[#0B63CE]" />
              <span className="text-sm font-semibold text-[#123047]">About system</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9AA8B5]" />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-3.5 flex items-center justify-between text-left hover:bg-red-50 transition-colors rounded-lg px-2"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-[#DC3D3D]" />
              <span className="text-sm font-semibold text-[#DC3D3D]">Sign out</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#DC3D3D]/50" />
          </button>
        </div>
      </div>
    </div>
  );
}
