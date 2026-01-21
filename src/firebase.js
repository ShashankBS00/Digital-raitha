// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional


// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBkJpksPkTYN-wqNJrl8rZIIXL86PBBjig",
  authDomain: "digital-raita.firebaseapp.com",
  projectId: "digital-raita",
  storageBucket: "digital-raita.firebasestorage.app",
  messagingSenderId: "465740067086",
  appId: "1:465740067086:web:288d2613b5cd783fbe675f",
  measurementId: "G-E0S17Q1W7S"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;