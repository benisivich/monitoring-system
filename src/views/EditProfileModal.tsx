import React, { useState } from "react";
import { X, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { Personnel } from "../types";
import { saveUserProfile } from "../services/coastalFirebase";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Personnel | null;
  onProfileUpdated: (person: Personnel) => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  person,
  onProfileUpdated,
}: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(person?.displayName ?? "");
  const [email, setEmail] = useState(person?.email ?? "");
  const [phone, setPhone] = useState(person?.phone ?? "");
  const [employeeId, setEmployeeId] = useState(person?.employeeId ?? "");
  const [notes, setNotes] = useState(person?.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ text: string; success: boolean } | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!person?.uid) return;
    setBusy(true);
    setStatus(null);
    try {
      const updatedData: Partial<Personnel> = {
        displayName: displayName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        employeeId: employeeId.trim(),
        notes: notes.trim(),
      };

      await saveUserProfile(person.uid, updatedData);

      const fullUpdated: Personnel = {
        ...person,
        ...updatedData,
        displayName: displayName.trim() || person.username,
      };

      onProfileUpdated(fullUpdated);
      setStatus({ text: "Profile was updated in Firestore.", success: true });
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      console.error("Profile save error:", err);
      setStatus({ text: err.message || "Failed to update profile in Firestore.", success: false });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full custom-shadow-lg border border-[#D7E4F0] overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-[#0B63CE] text-white p-4 flex items-center justify-between">
          <h3 className="font-bold text-base">Edit Personnel Profile</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-3.5 text-sm">
          <p className="text-xs text-[#5C6E80]">
            Profile data is securely stored in Cloud Firestore (<span className="font-mono">users/{person?.uid || "uid"}</span>).
          </p>

          {status && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                status.success
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {status.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              )}
              <span>{status.text}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#123047] mb-1">Display Name</label>
            <input
              type="text"
              id="edit-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full h-10 px-3 border border-[#D7E4F0] rounded-xl text-sm bg-[#F7FBFE] focus:outline-none focus:border-[#0B63CE]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#123047] mb-1">Email</label>
            <input
              type="email"
              id="edit-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 px-3 border border-[#D7E4F0] rounded-xl text-sm bg-[#F7FBFE] focus:outline-none focus:border-[#0B63CE]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#123047] mb-1">Phone</label>
            <input
              type="tel"
              id="edit-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-10 px-3 border border-[#D7E4F0] rounded-xl text-sm bg-[#F7FBFE] focus:outline-none focus:border-[#0B63CE]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#123047] mb-1">Employee ID</label>
            <input
              type="text"
              id="edit-employee-id"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full h-10 px-3 border border-[#D7E4F0] rounded-xl text-sm bg-[#F7FBFE] focus:outline-none focus:border-[#0B63CE]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#123047] mb-1">Notes / Station Assignment</label>
            <textarea
              rows={3}
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 border border-[#D7E4F0] rounded-xl text-sm bg-[#F7FBFE] focus:outline-none focus:border-[#0B63CE]"
            />
          </div>
        </div>

        <div className="p-4 border-t border-[#D7E4F0] bg-[#F7FBFE] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-[#5C6E80] hover:text-[#123047] rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            id="btn-save-profile"
            disabled={busy}
            onClick={() => void handleSave()}
            className="px-4 py-2 bg-[#0B63CE] hover:bg-[#084A9B] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {busy ? "Saving to Firestore..." : "Save to Firestore"}
          </button>
        </div>
      </div>
    </div>
  );
}
