import { doc, getDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "../lib/firebase";
import { loginWithGoogle } from "./firebase";

export const handleOnlinePlay = async (user: User | null) => {
  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists() && userDoc.data().username) {
    } else {
    }
  } else {
    const { user: newUser } = await loginWithGoogle();
    if (newUser) {
    }
  }
};
