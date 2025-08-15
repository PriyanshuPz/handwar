import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog } from "./ui";
import { Star } from "lucide-react";

export default function Home() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rounds, setRounds] = useState<3 | 5 | 7>(3);
  const [waitTime, setWaitTime] = useState<3 | 5>(3);
  const navigate = useNavigate();

  const handlePlayClick = () => {
    setIsDialogOpen(true);
  };

  const handleConfirm = () => {
    setIsDialogOpen(false);

    sessionStorage.setItem(
      "gameConfig",
      JSON.stringify({ rounds, waitTime, mode: "computer" })
    );

    navigate("/room", {
      state: {
        rounds,
        waitTime,
        mode: "computer",
      },
    });
  };
  return (
    <div className="min-h-screen p-6 bg-primary flex items-center justify-between flex-col space-y-2">
      <div></div>
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
        <Button
          className="bg-blue-500 text-white h-16"
          onClick={handlePlayClick}
        >
          Play
        </Button>
        <Button>Online</Button>
      </div>
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Configure Room"
      >
        <div className="space-y-6">
          {/* Rounds Selection */}
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

          {/* Wait Time Selection */}
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

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => setIsDialogOpen(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="bg-blue-500 text-white h-16"
            >
              Confirm
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
