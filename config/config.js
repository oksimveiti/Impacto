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

// input the actual Google Map API Key in ""
export const GOOGLE_MAPS_API_KEY = "AIzaSyCjD5D9MYiLHerfbG8pboypbl9SwCOqQc0";
export const MAP_ID = "ae787283e704c4e8";

// input the actual Firebase Config
export const firebaseConfig = {
  apiKey: "AIzaSyDb-yR-DIWYrNspU9YVs20XdEu3JGVjEA0",
  authDomain: "impacto-wmdd-project.firebaseapp.com",
  projectId: "impacto-wmdd-project",
  storageBucket: "impacto-wmdd-project.firebasestorage.app",
  messagingSenderId: "248126294653",
  appId: "1:248126294653:web:e3a626aba38edd679a3f14",
  apiKey: "AIzaSyDb-yR-DIWYrNspU9YVs20XdEu3JGVjEA0",
  authDomain: "impacto-wmdd-project.firebaseapp.com",
  projectId: "impacto-wmdd-project",
  storageBucket: "impacto-wmdd-project.firebasestorage.app",
  messagingSenderId: "248126294653",
  appId: "1:248126294653:web:e3a626aba38edd679a3f14",
};

// TinyMCE API Key
export const TINYMCE_API_KEY =
  "vkz275gtqnq6x7ivm1d9fcecj4xgehxqfhh2io8wjvrvj299";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
