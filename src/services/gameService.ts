import { doc, getDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "../lib/firebase";
import { loginWithGoogle } from "./firebase";
import { useGameStore } from "../store/gameStore";

export const handleOnlinePlay = async (user: User | null) => {
  const { setIsOnboarded, setIsOnlineDialogOpen } = useGameStore.getState();

  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists() && userDoc.data().username) {
      setIsOnboarded(true);
    } else {
      setIsOnboarded(false);
    }
    setIsOnlineDialogOpen(true);
  } else {
    const { user: newUser, isOnboarded } = await loginWithGoogle();
    if (newUser) {
      setIsOnboarded(isOnboarded);
      setIsOnlineDialogOpen(true);
    }
  }
};
