import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCzWm7BzAuEgbr3OYXQqzmg7eUwOyuBgLM",
  authDomain: "manga-infinity-2d200.firebaseapp.com",
  projectId: "manga-infinity-2d200",
  storageBucket: "manga-infinity-2d200.firebasestorage.app",
  messagingSenderId: "632600755308",
  appId: "1:632600755308:web:518b99ee9432a12195ec49",
  measurementId: "G-7MCEWM4JFY"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
setPersistence(auth, browserSessionPersistence).catch(console.error);
export const db = getFirestore(app);
