import React, { useState } from "react";
import { X, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "../firebase";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ text: string; success: boolean } | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!current || !next || !confirm) {
      setStatus({ text: "Fill in all password fields.", success: false });
      return;
    }
    if (next.length < 6) {
      setStatus({ text: "New password must be at least 6 characters.", success: false });
      return;
    }
    if (next !== confirm) {
      setStatus({ text: "New password and confirmation do not match.", success: false });
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      setStatus({ text: "No active Firebase session found.", success: false });
      return;
    }

    setBusy(true);
    setStatus(null);
    try {
      // Re-authenticate user before changing password
      const cred = EmailAuthProvider.credential(user.email, current);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, next);

      setCurrent("");
      setNext("");
      setConfirm("");
      setStatus({ text: "Password updated successfully in Firebase Authentication.", success: true });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error("Change password error:", err);
      let msg = err.message || "Failed to update password.";
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        msg = "Current password is incorrect.";
      } else if (err.code === "auth/weak-password") {
        msg = "New password is too weak. Use at least 6 characters.";
      }
      setStatus({ text: msg, success: false });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full custom-shadow-lg border border-[#D7E4F0] overflow-hidden flex flex-col">
        <div className="bg-[#0B63CE] text-white p-4 flex items-center justify-between">
          <h3 className="font-bold text-base">Change Password</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-sm">
          <p className="text-xs text-[#5C6E80] leading-relaxed">
            Your credentials are secured with Firebase Authentication and encrypted in transit and at rest.
          </p>

          {status && (
            <div
              className={`p-3 rounded-xl flex items-center gap-2 text-xs font-semibold ${
                status.success ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
              }`}
            >
              {status.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{status.text}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#123047] mb-1">Current password</label>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="w-full h-11 px-3 border border-[#D7E4F0] rounded-xl bg-[#F7FBFE] text-[#123047] text-sm focus:outline-none focus:border-[#0B63CE]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#123047] mb-1">New password (min. 6 chars)</label>
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className="w-full h-11 px-3 border border-[#D7E4F0] rounded-xl bg-[#F7FBFE] text-[#123047] text-sm focus:outline-none focus:border-[#0B63CE]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#123047] mb-1">Confirm new password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full h-11 px-3 border border-[#D7E4F0] rounded-xl bg-[#F7FBFE] text-[#123047] text-sm focus:outline-none focus:border-[#0B63CE]"
            />
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={handleSave}
            className="w-full h-12 bg-[#0B63CE] hover:bg-[#084A9B] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-2"
          >
            <Lock className="w-4 h-4" />
            {busy ? "Updating..." : "Update password"}
          </button>
        </div>
      </div>
    </div>
  );
}
