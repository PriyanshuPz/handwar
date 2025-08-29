import { useState } from "react";
import { useOnlineLobbyStore } from "../../store/onlineLobbyStore";
import { Button } from "../../components/ui/button";
import { Dialog } from "../../components/ui";
import { toast } from "sonner";

export function CreateRoomDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { createRoom, isCreatingRoom, error, setError } = useOnlineLobbyStore();
  const [username, setUsername] = useState<string>("Player");
  const [rounds, setRounds] = useState<number>(3);
  const [waitTime, setWaitTime] = useState<number>(3);

  const handleCreateRoom = async () => {
    try {
      await createRoom({
        username,
        maxRounds: rounds,
        waitTime,
      });
      onClose();
    } catch (error: any) {
      const errorMessage = error.message || "Failed to create room.";
      toast("Facing problem in creating room.", {
        description: errorMessage,
      });
      console.log(error);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {
        setError(null);
        onClose();
      }}
      title="Create Private Room"
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
            disabled={isCreatingRoom}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Number of Rounds
          </label>
          <select
            value={rounds}
            onChange={(e) => setRounds(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={isCreatingRoom}
          >
            <option value={3}>3 Rounds</option>
            <option value={5}>5 Rounds</option>
            <option value={7}>7 Rounds</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Time Per Round
          </label>
          <select
            value={waitTime}
            onChange={(e) => setWaitTime(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={isCreatingRoom}
          >
            <option value={3}>3 Seconds</option>
            <option value={5}>5 Seconds</option>
          </select>
        </div>

        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={isCreatingRoom}>
            Cancel
          </Button>
          <Button
            variant={"blue"}
            onClick={handleCreateRoom}
            disabled={!username.trim() || isCreatingRoom}
          >
            {isCreatingRoom ? "Creating..." : "Create"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
