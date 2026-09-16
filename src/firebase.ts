import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firebase Auth
export const auth = getAuth(app);

// Cloud Firestore instance configured with the applet's database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

// Mandatory connection test
export async function testFirebaseConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firestore connection check: client is offline or network is waiting.");
    }
  }
}
testFirebaseConnection();
