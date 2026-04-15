import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBX-yphdvEZ_qVwU-sH_KJ71uWPjLa-3YA",
  authDomain: "ask-ai-9b825.firebaseapp.com",
  projectId: "ask-ai-9b825",
  storageBucket: "ask-ai-9b825.firebasestorage.app",
  messagingSenderId: "319577394367",
  appId: "1:319577394367:web:5c31f81cd42b58709d4a0a",
  measurementId: "G-LWV89YEFX4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
