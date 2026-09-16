import React, { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { Navbar } from "./components/Navbar";
import { PacketSimulatorModal } from "./components/PacketSimulatorModal";
import { LoginView } from "./views/LoginView";
import { DashboardView } from "./views/DashboardView";
import { MonitorView } from "./views/MonitorView";
import { AlertsView } from "./views/AlertsView";
import { HistoryView } from "./views/HistoryView";
import { ReportsView } from "./views/ReportsView";
import { ProfileView } from "./views/ProfileView";
import { EditProfileModal } from "./views/EditProfileModal";
import { ChangePasswordModal } from "./views/ChangePasswordModal";
import { SecurityModal } from "./views/SecurityModal";
import { AboutModal } from "./views/AboutModal";
import {
  getUserProfile,
  subscribeToGatewaySnapshot,
  updateAlertStatus,
} from "./services/coastalFirebase";
import { getPersonnel, setPersonnel, setSession } from "./session";
import { GatewaySnapshot, Personnel, TabType } from "./types";

const defaultSnapshot: GatewaySnapshot = {
  connected: false,
  lastHeardAt: null,
  buoys: [],
  alerts: [],
  history: [],
};

export function App() {
  const [person, setPerson] = useState<Personnel | null>(() => getPersonnel());
  const [currentTab, setCurrentTab] = useState<TabType>("dashboard");
  const [snapshot, setSnapshot] = useState<GatewaySnapshot>(defaultSnapshot);
  const [authChecking, setAuthChecking] = useState(true);

  // Modals
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser);
          const token = await firebaseUser.getIdToken();
          setPerson(profile);
          setPersonnel(profile);
          setSession(token, profile);
        } catch (err) {
          console.error("Failed to load user profile:", err);
        }
      } else {
        // If not authenticated via Firebase, check if user logged in via Local/Test mode
        const existingPerson = getPersonnel();
        if (existingPerson && existingPerson.uid && existingPerson.uid.startsWith("test-")) {
          setPerson(existingPerson);
        } else {
          setPerson(null);
          setPersonnel(null);
          setSession("", null);
        }
      }
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time Cloud Firestore subscription for buoys, alerts, history, and gateway status
  useEffect(() => {
    if (!person) return;

    // Listen to real-time updates from Cloud Firestore
    const unsubscribe = subscribeToGatewaySnapshot((newSnapshot) => {
      setSnapshot(newSnapshot);
    });

    return () => unsubscribe();
  }, [person]);

  const handleLoginSuccess = (user: Personnel) => {
    setPerson(user);
    setPersonnel(user);
    setCurrentTab("dashboard");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("Sign out error:", err);
    }
    setSession("", null);
    setPersonnel(null);
    setPerson(null);
    setSnapshot(defaultSnapshot);
  };

  const handleUpdateAlertStatus = async (
    id: string,
    status: "active" | "acknowledged" | "resolved"
  ) => {
    try {
      await updateAlertStatus(id, status);
    } catch (err) {
      console.error("Failed to update alert in Firestore:", err);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#F0F5FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0B63CE] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-[#123047]">Connecting to Firestore...</span>
        </div>
      </div>
    );
  }

  if (!person) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const activeAlertsCount = (snapshot?.alerts || []).filter((a) => a.status === "active").length;
  const officerName = person?.displayName || person?.username || "Officer";

  return (
    <div className="min-h-screen bg-[#F0F5FA] text-[#123047] flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeAlertsCount={activeAlertsCount}
        officerName={officerName}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
      />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentTab === "dashboard" && (
          <DashboardView
            snapshot={snapshot}
            onSelectTab={setCurrentTab}
            onOpenSimulator={() => setIsSimulatorOpen(true)}
            onUpdateAlertStatus={handleUpdateAlertStatus}
          />
        )}

        {currentTab === "monitor" && (
          <MonitorView
            snapshot={snapshot}
            onOpenSimulator={() => setIsSimulatorOpen(true)}
          />
        )}

        {currentTab === "alerts" && (
          <AlertsView
            snapshot={snapshot}
            alerts={snapshot?.alerts || []}
            onUpdateStatus={handleUpdateAlertStatus}
            onOpenSimulator={() => setIsSimulatorOpen(true)}
          />
        )}

        {currentTab === "history" && (
          <HistoryView
            snapshot={snapshot}
            history={snapshot?.history || []}
          />
        )}

        {currentTab === "reports" && (
          <ReportsView snapshot={snapshot} officerName={officerName} />
        )}

        {currentTab === "profile" && (
          <ProfileView
            person={person}
            onOpenEditProfile={() => setIsEditProfileOpen(true)}
            onOpenChangePassword={() => setIsChangePasswordOpen(true)}
            onOpenSecurity={() => setIsSecurityOpen(true)}
            onOpenAbout={() => setIsAboutOpen(true)}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* LoRa Packet Ingestion Simulator Modal (connected to Firestore) */}
      <PacketSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        buoys={snapshot.buoys}
      />

      {/* Modals */}
      {isEditProfileOpen && (
        <EditProfileModal
          person={person}
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          onProfileUpdated={(updated) => {
            setPerson(updated);
            setPersonnel(updated);
          }}
        />
      )}

      {isChangePasswordOpen && (
        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
        />
      )}

      {isSecurityOpen && (
        <SecurityModal
          person={person}
          isOpen={isSecurityOpen}
          onClose={() => setIsSecurityOpen(false)}
        />
      )}

      {isAboutOpen && (
        <AboutModal
          isOpen={isAboutOpen}
          onClose={() => setIsAboutOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
