import { useState } from "react";
import { useOnlineLobbyStore } from "../../store/onlineLobbyStore";
import { Dialog } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/button";

export function JoinRoomDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { joinRoom, isJoiningRoom, error, setError } = useOnlineLobbyStore();
  const [accessCode, setAccessCode] = useState<string>("");
  const [username, setUsername] = useState<string>("Player");

  const handleJoinRoom = async () => {
    try {
      await joinRoom(accessCode.toUpperCase(), username);
      onClose();
    } catch (error) {
      // Error is handled by the store
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {
        setError(null);
        onClose();
      }}
      title="Join Private Room"
    >
      <div className="space-y-4 py-2">
        <div>
          <label className="block text-sm font-medium mb-1">Your Name</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            maxLength={15}
            disabled={isJoiningRoom}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Room Code</label>
          <input
            type="text"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            placeholder="Enter 6-character code"
            className="w-full px-3 py-2 border border-gray-300 rounded-md uppercase"
            maxLength={6}
            disabled={isJoiningRoom}
          />
        </div>

        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={isJoiningRoom}>
            Cancel
          </Button>
          <Button
            variant={"blue"}
            onClick={handleJoinRoom}
            disabled={
              accessCode.length !== 6 || !username.trim() || isJoiningRoom
            }
          >
            {isJoiningRoom ? "Joining..." : "Join"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
