import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyALX9UnEaQpGu7oxvtr2TM-j6A1AaVjcp0",
  authDomain: "cleanroute-39283.firebaseapp.com",
  projectId: "cleanroute-39283",
  storageBucket: "cleanroute-39283.firebasestorage.app",
  messagingSenderId: "1080225168585",
  appId: "1:1080225168585:web:efeaab090a36c156962118",
  measurementId: "G-76CSE1510X"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Use session persistence so different tabs can have different signed-in users
setPersistence(auth, browserSessionPersistence).catch((error) => {
  console.error("Failed to set session persistence:", error);
});
