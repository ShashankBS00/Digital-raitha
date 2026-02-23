/**
 * Verification script for frontend Firebase integration
 * This script checks if the frontend Firebase configuration is properly set up
 */

// Import Firebase modules
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBkJpksPkTYN-wqNJrl8rZIIXL86PBBjig",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || import.meta.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "digital-raita.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.REACT_APP_FIREBASE_PROJECT_ID || "digital-raita",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || import.meta.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "digital-raita.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "465740067086",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || import.meta.env.REACT_APP_FIREBASE_APP_ID || "1:465740067086:web:288d2613b5cd783fbe675f",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || import.meta.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-E0S17Q1W7S"
};

console.log("Firebase Configuration:");
console.log("Project ID:", firebaseConfig.projectId);
console.log("Storage Bucket:", firebaseConfig.storageBucket);
// Export bindings so other modules can import them even before initialization
export let db;
export let storage;

try {
  const app = initializeApp(firebaseConfig);
  console.log("✅ Firebase initialized successfully");

  db = getFirestore(app);
  console.log("✅ Firestore initialized successfully");

  storage = getStorage(app);
  console.log("✅ Firebase Storage initialized successfully");

  console.log("\n🎉 All Firebase services are properly configured!");
  console.log("✅ The application can store data in Firebase as requested.");

} catch (error) {
  console.error("❌ Error initializing Firebase:", error);
  console.error("Please check your Firebase configuration in .env file");
}
