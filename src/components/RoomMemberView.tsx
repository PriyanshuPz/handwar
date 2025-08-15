import { useEffect, useState } from "react";
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayRemove,
  getDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { Copy, Crown, X } from "lucide-react";

interface RoomMemberViewProps {
  roomId: string;
  onLeaveRoom: () => void;
  onStartGame: () => void;
}

interface Player {
  uid: string;
  username: string;
  email?: string;
}

export default function RoomMemberView({
  roomId,
  onLeaveRoom,
  onStartGame,
}: RoomMemberViewProps) {
  const { user } = useAuth();
  const [gameRoom, setGameRoom] = useState<any>(null);
  const [members, setMembers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    const unsub = onSnapshot(doc(db, "gameRooms", roomId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setGameRoom(data);
        setIsHost(data.host === user?.uid);
      } else {
        // Handle room not found
        onLeaveRoom();
      }
    });
    return () => unsub();
  }, [roomId, user, onLeaveRoom]);

  useEffect(() => {
    if (gameRoom?.players) {
      const fetchPlayers = async () => {
        const playerPromises = gameRoom.players.map((uid: string) =>
          getDoc(doc(db, "users", uid))
        );
        const playerDocs = await Promise.all(playerPromises);
        const playerList = playerDocs
          .filter((doc) => doc.exists())
          .map((doc) => doc.data() as Player);
        setMembers(playerList);
      };
      fetchPlayers();
    }
  }, [gameRoom]);

  const handleCopyJoinCode = () => {
    navigator.clipboard.writeText(roomId);
    // You can add a toast notification here
  };

  const handleKickPlayer = async (playerUid: string) => {
    if (!isHost) return;
    await updateDoc(doc(db, "gameRooms", roomId), {
      players: arrayRemove(playerUid),
    });
  };

  const handleStartGameClick = async () => {
    if (!isHost) return;
    await updateDoc(doc(db, "gameRooms", roomId), {
      status: "playing",
    });
    onStartGame();
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-4">Room Lobby</h2>
      <div className="flex items-center justify-center space-x-2 mb-6">
        <input
          type="text"
          readOnly
          value={roomId}
          className="w-full p-2 border rounded-lg bg-gray-100"
        />
        <Button onClick={handleCopyJoinCode} variant="ghost" className="w-10">
          <Copy className="h-5 w-5" />
        </Button>
      </div>

      <h3 className="font-bold mb-2">Players ({members.length}/2)</h3>
      <div className="space-y-2 mb-6">
        {members.map((member) => (
          <div
            key={member.uid}
            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center">
              <span>{member.username}</span>
              {gameRoom?.host === member.uid && (
                <Crown className="h-4 w-4 ml-2 text-yellow-500" />
              )}
            </div>
            {isHost && member.uid !== user?.uid && (
              <Button
                onClick={() => handleKickPlayer(member.uid)}
                variant="ghost"
                className="text-red-500 hover:text-red-700 w-10"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col space-y-2">
        {isHost && (
          <Button
            onClick={handleStartGameClick}
            variant="blue"
            disabled={members.length < 2}
          >
            Start Game
          </Button>
        )}
        <Button onClick={onLeaveRoom} variant="outline">
          Leave Room
        </Button>
      </div>
    </div>
  );
}
