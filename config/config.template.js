import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-storage.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

// INSTRUCTIONS:
// 1. Copy this file to config.js
// 2. Replace the placeholder values below with your actual API keys
// 3. Never commit config.js to git (it's already in .gitignore)

// Get your Google Maps API Key from: https://console.cloud.google.com/
export const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY_HERE";
export const MAP_ID = "YOUR_MAP_ID_HERE";

// Get your Firebase config from: https://console.firebase.google.com/
export const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY_HERE",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Get your TinyMCE API Key from: https://www.tiny.cloud/
export const TINYMCE_API_KEY = "YOUR_TINYMCE_API_KEY_HERE";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
