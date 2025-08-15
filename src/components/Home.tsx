import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import OnlineLobbyDialog from "./OnlineLobby";
import { useGameStore } from "../store/gameStore";
import { handleOnlinePlay } from "../services/gameService";
import SinglePlayerRoomConfigDialog from "../singleplayer/components/SinglePlayerRoomConfigDialog";
import { useState } from "react";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { isOnlineDialogOpen, isOnboarded, setIsOnlineDialogOpen } =
    useGameStore();

  const handlePlayClick = () => {
    setIsDialogOpen(true);
  };

  const handleOnlinePlayClick = () => {
    handleOnlinePlay(user);
  };

  const handleConfirm = () => {
    setIsDialogOpen(false);
    navigate("/room");
  };

  return (
    <div className="min-h-screen p-6 bg-primary flex items-center justify-between flex-col space-y-2">
      <div />
      <div className="flex flex-col items-center justify-center space-y-4 w-full">
        <div className="relative text-center overflow-hidden transform -rotate-8 w-full h-full">
          <motion.div
            initial={{ x: -200, opacity: 0, rotateY: -45 }}
            animate={{ x: 0, opacity: 1, rotateY: 0 }}
            transition={{
              duration: 0.8,
              ease: "backOut",
              delay: 0.3,
            }}
            className="text-9xl max-sm:text-8xl font-game tracking-widest mr-40"
          >
            HAND
          </motion.div>

          <motion.div
            initial={{ x: 200, opacity: 0, rotateY: 45 }}
            animate={{ x: 0, opacity: 1, rotateY: 0 }}
            transition={{
              duration: 0.8,
              ease: "backOut",
              delay: 0.7,
            }}
            className="text-9xl max-sm:text-8xl font-game tracking-widest max-sm:ml-20 ml-40 -mt-4"
          >
            WAR
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            ease: "easeOut",
            delay: 1.2,
          }}
          className="font-game text-white max-w-md text-center bg-green-500 p-2 px-4 rounded-sm flex items-center justify-center space-x-2"
        >
          <Star /> <span>Now Play Online</span>
        </motion.div>
        <div className="text-gray-500 text-lg max-w-md text-center">
          A simple game of war, where you can play against the computer or
          challenge your friends online.
        </div>
      </div>

      <div className="flex space-y-2 flex-col w-full max-w-md mt-4">
        <Button variant="blue" onClick={handlePlayClick}>
          Play
        </Button>
        <Button onClick={handleOnlinePlayClick}>Online</Button>
      </div>

      <SinglePlayerRoomConfigDialog
        handleConfirm={handleConfirm}
        isDialogOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />

      <OnlineLobbyDialog
        isOnboarded={isOnboarded}
        isOpen={isOnlineDialogOpen}
        onClose={() => setIsOnlineDialogOpen(false)}
      />
    </div>
  );
}
