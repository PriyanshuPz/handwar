import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { CreateRoomDialog } from "./CreateRoomDialog";
import { JoinRoomDialog } from "./JoinRoomDialog";
import { useOnlineLobbyStore } from "../../store/onlineLobbyStore";

export function MultiplayerLobby() {
  const navigate = useNavigate();
  const { roomInstance, error, setError } = useOnlineLobbyStore();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);

  // If we already have an active room, redirect to the room page
  useEffect(() => {
    if (roomInstance) {
      navigate("/multiplayer/room");
    }

    // Clear any previous errors when component mounts
    return () => setError(null);
  }, [roomInstance, navigate, setError]);

  return (
    <div className="h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-white border-4 border-black rounded-2xl p-6 w-full max-w-md relative shadow-[0_8px_0px_0px_#000]">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Play with Friends
        </h1>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-100 p-3 rounded-md mb-4">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <Button
            className="w-full py-6 text-lg"
            variant="green"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            Create Private Room
          </Button>

          <Button
            className="w-full py-6 text-lg"
            variant="blue"
            onClick={() => setIsJoinDialogOpen(true)}
          >
            Join Private Room
          </Button>

          <Button
            className="w-full mt-8"
            variant="default"
            onClick={() => navigate("/")}
          >
            Back to Menu
          </Button>
        </div>
      </div>

      <CreateRoomDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />

      <JoinRoomDialog
        isOpen={isJoinDialogOpen}
        onClose={() => setIsJoinDialogOpen(false)}
      />
    </div>
  );
}
