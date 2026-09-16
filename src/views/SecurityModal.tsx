import React, { useEffect, useState } from "react";
import { X, Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { Personnel } from "../types";
import { getSecurityState, saveSecurityState } from "../services/coastalFirebase";

interface SecurityModalProps {
  person: Personnel | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SecurityModal({ person, isOpen, onClose }: SecurityModalProps) {
  const [sessionLock, setSessionLock] = useState(false);
  const [confirmAlerts, setConfirmAlerts] = useState(false);
  const [auditTrail, setAuditTrail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ text: string; success: boolean } | null>(null);

  useEffect(() => {
    if (!isOpen || !person?.uid) return;
    void getSecurityState(person.uid)
      .then((sec) => {
        setSessionLock(sec.sessionLock);
        setConfirmAlerts(sec.confirmAlerts);
        setAuditTrail(sec.auditTrail);
      })
      .catch((err) => console.warn("Failed to load security state:", err));
  }, [isOpen, person]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!person?.uid) return;
    setBusy(true);
    setStatus(null);
    try {
      await saveSecurityState(person.uid, {
        sessionLock,
        confirmAlerts,
        auditTrail,
      });
      setStatus({ text: "Security settings saved to Cloud Firestore.", success: true });
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error("Security save error:", err);
      setStatus({ text: err.message || "Failed to update security settings.", success: false });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full custom-shadow-lg border border-[#D7E4F0] overflow-hidden flex flex-col">
        <div className="bg-[#0B63CE] text-white p-4 flex items-center justify-between">
          <h3 className="font-bold text-base">Station Security Settings</h3>
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
            These security rules are synchronized with your personnel profile in Cloud Firestore.
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

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-[#D7E4F0] bg-[#F7FBFE] cursor-pointer hover:bg-white transition-colors">
              <input
                type="checkbox"
                checked={sessionLock}
                onChange={(e) => setSessionLock(e.target.checked)}
                className="mt-1 w-4 h-4 text-[#0B63CE] rounded"
              />
              <div>
                <span className="font-semibold text-xs text-[#123047] block">Auto Session Lock</span>
                <span className="text-[11px] text-[#5C6E80] block mt-0.5">
                  Require officer re-authentication on idle terminal timeout.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-[#D7E4F0] bg-[#F7FBFE] cursor-pointer hover:bg-white transition-colors">
              <input
                type="checkbox"
                checked={confirmAlerts}
                onChange={(e) => setConfirmAlerts(e.target.checked)}
                className="mt-1 w-4 h-4 text-[#0B63CE] rounded"
              />
              <div>
                <span className="font-semibold text-xs text-[#123047] block">Confirmation on Alert Resolution</span>
                <span className="text-[11px] text-[#5C6E80] block mt-0.5">
                  Display confirmation dialog before marking geofence violations as resolved.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-[#D7E4F0] bg-[#F7FBFE] cursor-pointer hover:bg-white transition-colors">
              <input
                type="checkbox"
                checked={auditTrail}
                onChange={(e) => setAuditTrail(e.target.checked)}
                className="mt-1 w-4 h-4 text-[#0B63CE] rounded"
              />
              <div>
                <span className="font-semibold text-xs text-[#123047] block">Strict Audit Trail</span>
                <span className="text-[11px] text-[#5C6E80] block mt-0.5">
                  Log all personnel map interactions and packet simulations to the history collection.
                </span>
              </div>
            </label>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={handleSave}
            className="w-full h-12 bg-[#0B63CE] hover:bg-[#084A9B] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-2"
          >
            <Shield className="w-4 h-4" />
            {busy ? "Saving..." : "Save Settings to Firestore"}
          </button>
        </div>
      </div>
    </div>
  );
}
