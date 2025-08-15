import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from "../contexts/AuthContext";
import { auth, db } from "../lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  limit,
  doc,
  updateDoc,
  getDoc,
  arrayRemove,
  deleteDoc,
  arrayUnion,
  onSnapshot,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { Dialog } from "./ui";
import Onboarding from "./Onboarding";
import RoomMemberView from "./RoomMemberView";
import { Play } from "lucide-react";
import { toast } from "sonner";

interface OnlineLobbyDialogProps {
  isOpen: boolean;
  isOnboarded: boolean;
  onClose: () => void;
}

export default function OnlineLobbyDialog({
  isOnboarded,
  isOpen,
  onClose,
}: OnlineLobbyDialogProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFindingMatch, setIsFindingMatch] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rounds, setRounds] = useState<3 | 5 | 7>(3);
  const [waitTime, setWaitTime] = useState<3 | 5>(3);
  const [roomId, setRoomId] = useState("");

  const [isRoomMemberView, setIsRoomMemberView] = useState(false);

  const handleAutoMatchmake = async () => {
    if (!user) return;
    setIsFindingMatch(true);

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
            host: user.uid, // Set current user as host for auto-matched games
          });

          await updateDoc(doc(db, "waitingPool", waitingPlayerId), {
            status: "matched",
            gameRoomId: gameRoomRef.id,
          });

          // Auto-matched games start immediately
          setIsFindingMatch(false);
          onClose();
          navigate(`/room/${gameRoomRef.id}`);
        }
      } else {
        const waitingDocRef = await addDoc(collection(db, "waitingPool"), {
          uid: user.uid,
          status: "waiting",
          timestamp: serverTimestamp(),
        });

        // Set timeout for matchmaking
        setTimeout(async () => {
          const waitingDoc = await getDoc(waitingDocRef);
          if (waitingDoc.exists() && waitingDoc.data().status === "waiting") {
            await updateDoc(waitingDocRef, { status: "timedout" });
            setIsFindingMatch(false);
            toast.error("No match found. Please try again later.");
          }
        }, 15000);
      }
    } catch (error) {
      console.error("Error during matchmaking:", error);
      setIsFindingMatch(false);
      toast.error("Matchmaking failed. Please try again.");
    }
  };

  const handleCreateCustomRoom = () => {
    setIsDialogOpen(true);
  };

  // listen for the changes in the room if user kicked then notify them
  useEffect(() => {
    if (!roomId) return;
    const unsub = onSnapshot(doc(db, "gameRooms", roomId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.players && !data.players.includes(user?.uid)) {
          // User was kicked from the room
          setIsRoomMemberView(false);
          toast("You have been kicked from the room");
        } else if (data.status === "playing") {
          // Game has started, navigate to the game room
          setIsRoomMemberView(false); // Close the member view
          onClose(); // Close the dialog
          navigate(`/room/${roomId}`);
        }
      } else {
        // Room was deleted
        setIsRoomMemberView(false);
        setRoomId("");
        toast("Room was deleted");
      }
    });
    return () => unsub();
  }, [roomId, user, navigate, onClose]);

  // Listen for matchmaking results when waiting
  useEffect(() => {
    if (!isFindingMatch || !user) return;

    const q = query(
      collection(db, "waitingPool"),
      where("uid", "==", user.uid),
      where("status", "in", ["matched", "timedout"])
    );

    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docs.forEach(async (doc) => {
        const data = doc.data();
        if (data.status === "matched" && data.gameRoomId) {
          setIsFindingMatch(false);
          onClose();
          navigate(`/room/${data.gameRoomId}`);
          // Clean up the waiting pool entry
          await deleteDoc(doc.ref);
        } else if (data.status === "timedout") {
          setIsFindingMatch(false);
          toast.error("No match found. Please try again later.");
          // Clean up the waiting pool entry
          await deleteDoc(doc.ref);
        }
      });
    });

    return () => unsub();
  }, [isFindingMatch, user, navigate, onClose]);

  // Cleanup matchmaking when component unmounts or dialog closes
  useEffect(() => {
    return () => {
      if (isFindingMatch && user) {
        // Cancel any pending matchmaking
        const cancelMatchmaking = async () => {
          try {
            const q = query(
              collection(db, "waitingPool"),
              where("uid", "==", user.uid),
              where("status", "==", "waiting")
            );
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
              deleteDoc(doc.ref);
            });
          } catch (error) {
            console.error("Error canceling matchmaking:", error);
          }
        };
        cancelMatchmaking();
      }
    };
  }, []);

  const handleCancelMatchmaking = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, "waitingPool"),
        where("uid", "==", user.uid),
        where("status", "==", "waiting")
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        deleteDoc(doc.ref);
      });
      setIsFindingMatch(false);
      toast("Matchmaking cancelled");
    } catch (error) {
      console.error("Error canceling matchmaking:", error);
    }
  };

  const handleConfirmCreateRoom = async () => {
    if (!user) return;

    try {
      const gameRoomRef = await addDoc(collection(db, "gameRooms"), {
        players: [user.uid],
        status: "waiting",
        createdAt: serverTimestamp(),
        rounds,
        waitTime,
        scores: { [user.uid]: 0 },
        currentRound: 1,
        host: user.uid,
      });
      setRoomId(gameRoomRef.id);
      setIsDialogOpen(false);
      setIsRoomMemberView(true);
    } catch (error) {
      console.error("Error creating custom room:", error);
    }
  };

  const handleLeaveRoom = async () => {
    if (!user) return;
    try {
      const gameRoomRef = doc(db, "gameRooms", roomId);
      await updateDoc(gameRoomRef, {
        players: arrayRemove(user.uid),
      });
      setIsRoomMemberView(false);
      setRoomId("");
      setIsDialogOpen(false);

      // clean unused rooms
      const gameRoomsQuery = query(
        collection(db, "gameRooms"),
        where("status", "==", "waiting"),
        where("createdAt", "<", Date.now() - 15 * 60 * 1000) // 15 minutes ago
      );
      const querySnapshot = await getDocs(gameRoomsQuery);
      querySnapshot.forEach((doc) => {
        deleteDoc(doc.ref);
      });
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  };

  const handleJoinRoom = async () => {
    if (!user) return;
    if (!roomId) return;
    try {
      const gameRoomRef = doc(db, "gameRooms", roomId);
      const gameRoomSnap = await getDoc(gameRoomRef);
      if (gameRoomSnap.exists()) {
        await updateDoc(gameRoomRef, {
          players: arrayUnion(user.uid),
        });
        setIsRoomMemberView(true);
      } else {
        // Handle room not found
      }
    } catch (error) {
      console.error("Error joining room:", error);
    }
  };

  const handleStartGame = async () => {
    if (!user || !roomId) return;
    try {
      await updateDoc(doc(db, "gameRooms", roomId), {
        status: "playing",
      });
      // The useEffect will handle navigation when status changes
    } catch (error) {
      console.error("Error starting game:", error);
      toast.error("Failed to start game");
    }
  };

  const renderView = () => {
    if (!isOnboarded) {
      return <Onboarding />;
    }
    if (isRoomMemberView) {
      return (
        <RoomMemberView
          roomId={roomId}
          onLeaveRoom={handleLeaveRoom}
          onStartGame={handleStartGame}
        />
      );
    }

    if (isOnboarded && !isDialogOpen) {
      return (
        <div className="w-full max-w-md space-y-4">
          {!isFindingMatch && (
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="text"
                placeholder="Enter Room Code"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full p-2 border rounded-lg"
              />
              <Button
                className="w-12 p-0 h-12 flex items-center justify-center "
                onClick={handleJoinRoom}
                variant="blue"
              >
                <Play className="w-6 h-6" />
              </Button>
            </div>
          )}

          <Button
            variant="green"
            onClick={handleAutoMatchmake}
            disabled={isFindingMatch}
          >
            {isFindingMatch ? "Finding Match..." : "Auto Matchmake"}
          </Button>

          {isFindingMatch && (
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <p className="text-gray-500">Searching for a match...</p>
              </div>
              <Button
                variant="outline"
                onClick={handleCancelMatchmaking}
                className="w-full"
              >
                Cancel Matchmaking
              </Button>
            </div>
          )}

          {!isFindingMatch && (
            <>
              <Button onClick={handleCreateCustomRoom}>
                Create Custom Room
              </Button>
              <Button onClick={() => auth.signOut()}>Logout</Button>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Number of Rounds
          </label>
          <div className="flex gap-3">
            {([3, 5, 7] as const).map((round) => (
              <button
                key={round}
                onClick={() => setRounds(round)}
                className={`px-6 py-3 rounded-lg border-2 font-medium transition-all ${
                  rounds === round
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:border-gray-400 text-gray-700"
                }`}
              >
                {round}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Wait Time (seconds)
          </label>
          <div className="flex gap-3">
            {([3, 5] as const).map((time) => (
              <button
                key={time}
                onClick={() => setWaitTime(time)}
                className={`px-6 py-3 rounded-lg border-2 font-medium transition-all ${
                  waitTime === time
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:border-gray-400 text-gray-700"
                }`}
              >
                {time}s
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={() => setIsDialogOpen(false)}
            variant="outline"
            className="flex-1"
          >
            Back
          </Button>
          <Button onClick={handleConfirmCreateRoom} variant="blue">
            Create Room
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Online Lobby">
      {renderView()}
    </Dialog>
  );
}
