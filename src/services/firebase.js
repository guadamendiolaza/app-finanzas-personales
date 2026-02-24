import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuración de tu proyecto Firebase
// TEMPORAL: Debug de variables de entorno
console.log('🔍 DEBUG - Variables de entorno:');
console.log('API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY ? 'Configurada ✅' : 'FALTA ❌');
console.log('AUTH_DOMAIN:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? 'Configurada ✅' : 'FALTA ❌');
console.log('PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID ? 'Configurada ✅' : 'FALTA ❌');

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);