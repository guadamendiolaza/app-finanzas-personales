import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuración de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDqvFBD1PnhfMOOfF_KDq8NmN6ofNJSJUM",
  authDomain: "finanzas-personales-ce30a.firebaseapp.com",
  projectId: "finanzas-personales-ce30a",
  storageBucket: "finanzas-personales-ce30a.firebasestorage.app",
  messagingSenderId: "974307261836",
  appId: "1:974307261836:web:ac2145e9199833bac86aa9"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);