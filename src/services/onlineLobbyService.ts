import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  limit,
  updateDoc,
  getDoc,
  arrayRemove,
  deleteDoc,
  arrayUnion,
  onSnapshot,
  doc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "sonner";
import type { User } from "firebase/auth";
import type { GameRoom, Player } from "../types";
import { useOnlineLobbyStore } from "../store/onlineLobbyStore";
import { useGameStore } from "../store/gameStore";
import { useAuth } from "../contexts/AuthContext";

export const handleAutoMatchmake = async (user: User) => {
  const { setFindingMatch } = useOnlineLobbyStore.getState();
  setFindingMatch(true);

  try {
    const q = query(
      collection(db, "waitingPool"),
      where("status", "==", "waiting"),
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const waitingPlayer = querySnapshot.docs[0].data();
      const waitingPlayerId = querySnapshot.docs[0].id;

      if (waitingPlayer.uid !== user.uid) {
        const gameRoomRef = await addDoc(collection(db, "gameRooms"), {
          players: [user.uid, waitingPlayer.uid],
          status: "playing",
          createdAt: serverTimestamp(),
          rounds: 3,
          waitTime: 3,
          scores: { [user.uid]: 0, [waitingPlayer.uid]: 0 },
          currentRound: 1,
        });

        await updateDoc(doc(db, "waitingPool", waitingPlayerId), {
          status: "matched",
          gameRoomId: gameRoomRef.id,
        });

        return gameRoomRef.id;
      }
    } else {
      const waitingDocRef = await addDoc(collection(db, "waitingPool"), {
        uid: user.uid,
        status: "waiting",
        timestamp: serverTimestamp(),
      });

      setTimeout(async () => {
        const waitingDoc = await getDoc(waitingDocRef);
        if (waitingDoc.exists() && waitingDoc.data().status === "waiting") {
          await updateDoc(waitingDocRef, { status: "timedout" });
          setFindingMatch(false);
          toast.error("No match found. Please try again later.");
        }
      }, 15000);
    }
  } catch (error) {
    console.error("Error during matchmaking:", error);
    setFindingMatch(false);
  }
  return null;
};

export const createCustomRoom = async (user: User) => {
  const { gameConfig } = useGameStore.getState();
  const { setRoomId, setRoomMemberView } = useOnlineLobbyStore.getState();

  try {
    const gameRoomRef = await addDoc(collection(db, "gameRooms"), {
      players: [user.uid],
      status: "waiting",
      createdAt: serverTimestamp(),
      rounds: gameConfig.rounds,
      waitTime: gameConfig.waitTime,
      scores: { [user.uid]: 0 },
      currentRound: 1,
      host: user.uid,
    });
    setRoomId(gameRoomRef.id);
    setRoomMemberView(true);
  } catch (error) {
    console.error("Error creating custom room:", error);
  }
};

export const joinRoom = async (user: User, roomId: string) => {
  const { setRoomMemberView } = useOnlineLobbyStore.getState();
  try {
    const gameRoomRef = doc(db, "gameRooms", roomId);
    const gameRoomSnap = await getDoc(gameRoomRef);
    if (gameRoomSnap.exists()) {
      await updateDoc(gameRoomRef, {
        players: arrayUnion(user.uid),
      });
      setRoomMemberView(true);
    } else {
      toast.error("Room not found.");
    }
  } catch (error) {
    console.error("Error joining room:", error);
  }
};

export const leaveRoom = async (user: User, roomId: string) => {
  const { reset } = useOnlineLobbyStore.getState();
  try {
    const gameRoomRef = doc(db, "gameRooms", roomId);
    await updateDoc(gameRoomRef, {
      players: arrayRemove(user.uid),
    });
    reset();

    // clean unused rooms
    const gameRoomsQuery = query(
      collection(db, "gameRooms"),
      where("status", "==", "waiting"),
      where("createdAt", "<", new Date(Date.now() - 15 * 60 * 1000)) // 15 minutes ago
    );
    const querySnapshot = await getDocs(gameRoomsQuery);
    querySnapshot.forEach((doc) => {
      deleteDoc(doc.ref);
    });
  } catch (error) {
    console.error("Error leaving room:", error);
  }
};

export const listenForKicks = (roomId: string, user: User) => {
  const { setRoomMemberView } = useOnlineLobbyStore.getState();
  const unsub = onSnapshot(doc(db, "gameRooms", roomId), (doc) => {
    if (doc.exists()) {
      const data = doc.data() as GameRoom;
      if (data.players && !data.players.includes(user?.uid)) {
        setRoomMemberView(false);
        toast("You have been kicked from the room");
      }
    }
  });
  return unsub;
};

export const listenToRoomMembers = (roomId: string) => {
  const { setGameRoom, setMembers, setIsHost } = useOnlineLobbyStore.getState();
  const { user } = useAuth();

  const unsub = onSnapshot(doc(db, "gameRooms", roomId), async (_doc) => {
    if (_doc.exists()) {
      const roomData = { ..._doc.data(), id: _doc.id } as GameRoom;
      setGameRoom(roomData);
      setIsHost(roomData.host === user?.uid);

      if (roomData.players) {
        const playerPromises = roomData.players.map((uid: string) =>
          getDoc(doc(db, "users", uid))
        );
        const playerDocs = await Promise.all(playerPromises);
        const playerList = playerDocs
          .filter((doc) => doc.exists())
          .map((doc) => doc.data() as Player);
        setMembers(playerList);
      }
    } else {
      useOnlineLobbyStore.getState().reset();
    }
  });
  return unsub;
};

export const kickPlayer = async (roomId: string, playerUid: string) => {
  await updateDoc(doc(db, "gameRooms", roomId), {
    players: arrayRemove(playerUid),
  });
};

export const startGame = async (roomId: string) => {
  await updateDoc(doc(db, "gameRooms", roomId), {
    status: "playing",
  });
};
