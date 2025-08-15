import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import app, { db } from "../lib/firebase";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      // New user, needs onboarding
      return { user, isOnboarded: false };
    }
    return { user, isOnboarded: true };
  } catch (error) {
    console.error("Error during Google login:", error);
    return { user: null, isOnboarded: false };
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error during logout:", error);
  }
};

export const saveUsername = async (userId: string, username: string) => {
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, { username }, { merge: true });
};
