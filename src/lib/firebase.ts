import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCFfB-OFucl6TY67X0BTMhGGEYSJu4NKXE",
  authDomain: "handwar-pz.firebaseapp.com",
  projectId: "handwar-pz",
  storageBucket: "handwar-pz.firebasestorage.app",
  messagingSenderId: "829667112715",
  appId: "1:829667112715:web:b276faa05ee963e99d140e",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
