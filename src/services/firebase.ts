import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import app, { db } from "../lib/firebase";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    return { user };
  } catch (error) {
    console.error("Error during Google login:", error);
    return { user: null };
  }
};

export const getCurrentUser = async () => {
  if (auth.currentUser) {
    return auth.currentUser;
  } else {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    return user;
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
