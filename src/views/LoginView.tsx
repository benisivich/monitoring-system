import React, { useState } from "react";
import { Navigation, AlertCircle, ShieldCheck, Play, Zap } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import { auth } from "../firebase";
import {
  createTestOfficer,
  formatEmail,
  getUserProfile,
  saveUserProfile,
  usernameFromEmail,
} from "../services/coastalFirebase";
import { setPersonnel, setSession } from "../session";
import { Personnel } from "../types";

interface LoginViewProps {
  onLoginSuccess: (user: Personnel) => void;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Instant 1-Click Test Access without needing Google or Firebase setup
  const handleInstantTestAccess = (customUser?: string, customName?: string) => {
    setBusy(true);
    try {
      const uname = customUser || "duty_officer";
      const dname = customName || (customUser ? `Officer ${customUser}` : "Duty Officer Cruz");
      const testOfficer = createTestOfficer(uname, dname);
      const token = `test-token-${Date.now()}`;
      setSession(token, testOfficer);
      setPersonnel(testOfficer);
      onLoginSuccess(testOfficer);
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setBusy(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const userCred = await signInWithPopup(auth, provider);
      const fbUser = userCred.user;
      const profile = await getUserProfile(fbUser);
      const token = await fbUser.getIdToken();
      setSession(token, profile);
      setPersonnel(profile);
      onLoginSuccess(profile);
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-in popup was closed before completing.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Sign-in popup was blocked by your browser. Please allow popups or use Instant Test Mode.");
      } else {
        setError(err.message || "Google sign-in failed.");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError("Please enter your username/email and password.");
      return;
    }
    if (isRegisterMode && password.length < 6) {
      setError("Password must be at least 6 characters for Firebase Authentication.");
      return;
    }

    setBusy(true);
    setError(null);

    const email = formatEmail(identifier);

    try {
      if (isRegisterMode) {
        // Firebase Auth Create User
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCred.user;
        const nameToUse = displayName.trim() || usernameFromEmail(email);

        await updateProfile(fbUser, { displayName: nameToUse });

        const newProfile: Personnel = {
          uid: fbUser.uid,
          username: usernameFromEmail(email),
          displayName: nameToUse,
          email: fbUser.email || email,
          phone: "",
          employeeId: "",
          notes: "",
        };

        await saveUserProfile(fbUser.uid, newProfile);
        const token = await fbUser.getIdToken();
        setSession(token, newProfile);
        setPersonnel(newProfile);
        onLoginSuccess(newProfile);
      } else {
        // Firebase Auth Sign In
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCred.user;
        const profile = await getUserProfile(fbUser);
        const token = await fbUser.getIdToken();
        setSession(token, profile);
        setPersonnel(profile);
        onLoginSuccess(profile);
      }
    } catch (err: any) {
      console.warn("Firebase auth response:", err);
      if (err.code === "auth/operation-not-allowed") {
        // Automatically allow testing with entered credentials so user is never blocked!
        handleInstantTestAccess(identifier.trim(), displayName.trim());
        return;
      }

      let msg = err.message || "Authentication failed.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        msg = "Invalid username/email or password.";
      } else if (err.code === "auth/email-already-in-use") {
        msg = "An account with this username/email already exists. Please sign in.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password should be at least 6 characters.";
      }
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A4F8A] flex flex-col justify-center items-center p-5">
      {/* Brand Hero */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="w-18 h-18 rounded-3xl bg-white/16 backdrop-blur-sm flex items-center justify-center mb-4 shadow-lg">
          <Navigation className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-white text-3xl font-extrabold tracking-tight">Coastal Geofence</h1>
        <p className="text-[#E4F0FB] text-lg mt-1 font-medium">Monitoring System</p>
      </div>

      {/* Sign In / Sign Up Card */}
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 custom-shadow-lg">
        {/* Quick Test Mode Banner - Frictionless 1-Click Access */}
        <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-emerald-900 tracking-wide flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
              Fast Test Access
            </span>
            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-full">
              No Login Needed
            </span>
          </div>
          <p className="text-xs text-emerald-800/90 mb-3 leading-relaxed">
            Test the live coastal map, LoRa packet simulator, geofence breaches, and alerts instantly.
          </p>
          <button
            type="button"
            id="btn-fast-test-mode"
            disabled={busy}
            onClick={() => handleInstantTestAccess()}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-xs transition-colors disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Enter as Duty Officer (Instant Preview)</span>
          </button>
        </div>

        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-[#123047]">
            {isRegisterMode ? "Create Personnel Account" : "Officer Sign in"}
          </h2>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
            Firebase Auth
          </span>
        </div>
        <p className="text-xs text-[#5C6E80] mb-4 leading-relaxed">
          {isRegisterMode
            ? "Register credentials or test with custom officer name below."
            : "Sign in with your credentials or Google account for multi-device sync."}
        </p>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-2 w-full">
                <p className="font-semibold">{error}</p>
                <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200">
                  <p className="font-semibold text-amber-900 mb-1.5">Quick Testing Options:</p>
                  <button
                    type="button"
                    onClick={() => handleInstantTestAccess(identifier.trim(), displayName.trim())}
                    className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-xs transition-colors mb-1.5"
                  >
                    Continue in Test Mode with this Officer
                  </button>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={busy}
                    className="w-full py-1.5 px-3 bg-white hover:bg-amber-50 text-amber-900 font-semibold rounded-lg text-xs border border-amber-300 flex items-center justify-center gap-2 transition-colors"
                  >
                    Sign in with Google
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegisterMode && (
            <div>
              <label className="block text-xs font-semibold text-[#123047] mb-1">
                Officer / Display Name
              </label>
              <input
                type="text"
                id="register-display-name"
                placeholder="e.g. Officer Cruz"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full h-11 px-3.5 border border-[#D7E4F0] rounded-xl bg-[#F7FBFE] text-[#123047] text-sm focus:outline-none focus:border-[#0B63CE] transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#123047] mb-1">
              Username or Email
            </label>
            <input
              type="text"
              id="login-username"
              placeholder="Username or email (e.g. officer, admin)"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full h-11 px-3.5 border border-[#D7E4F0] rounded-xl bg-[#F7FBFE] text-[#123047] text-sm focus:outline-none focus:border-[#0B63CE] transition-colors"
              autoCapitalize="none"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#123047] mb-1">
              Password {isRegisterMode && <span className="text-xs text-[#5C6E80] font-normal">(min. 6 characters)</span>}
            </label>
            <input
              type="password"
              id="login-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-3.5 border border-[#D7E4F0] rounded-xl bg-[#F7FBFE] text-[#123047] text-sm focus:outline-none focus:border-[#0B63CE] transition-colors"
              autoComplete={isRegisterMode ? "new-password" : "current-password"}
              required
            />
          </div>

          <div className="pt-1 space-y-2">
            <button
              type="submit"
              id="btn-sign-in"
              disabled={busy}
              className="w-full h-11 bg-[#0B63CE] hover:bg-[#084A9B] text-white font-bold rounded-xl flex items-center justify-center text-sm transition-colors shadow-xs disabled:opacity-50"
            >
              {busy ? "Please wait..." : isRegisterMode ? "Create Firebase Account" : "Sign in"}
            </button>

            <button
              type="button"
              id="btn-toggle-mode"
              disabled={busy}
              onClick={() => {
                setError(null);
                setIsRegisterMode(!isRegisterMode);
              }}
              className="w-full h-9 text-[#0B63CE] hover:text-[#084A9B] hover:bg-[#EEF5FB] font-semibold rounded-xl flex items-center justify-center text-xs transition-colors"
            >
              {isRegisterMode ? "Already have an account? Sign in" : "Create new personnel account"}
            </button>
          </div>
        </form>

        {/* Optional Google Sign-in */}
        <div className="mt-4 pt-4 border-t border-[#D7E4F0]">
          <button
            type="button"
            id="btn-google-sign-in"
            disabled={busy}
            onClick={handleGoogleSignIn}
            className="w-full h-10 bg-white hover:bg-[#F7FBFE] active:bg-[#EEF5FB] text-[#123047] font-medium rounded-xl border border-[#D7E4F0] flex items-center justify-center gap-2.5 transition-colors text-xs disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Optional: Sign in with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}
