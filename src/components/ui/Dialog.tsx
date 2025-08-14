import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "./button";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function Dialog({ isOpen, onClose, children, title }: DialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white border-4 border-black rounded-2xl p-6 w-full max-w-md relative shadow-[0_8px_0px_0px_#000]">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              {title && (
                <h2 className="text-2xl font-bold text-gray-900 mb-4 pr-8">
                  {title}
                </h2>
              )}
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface RoomConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: { rounds: number; waitTime: number }) => void;
}

export function RoomConfigDialog({
  isOpen,
  onClose,
  onConfirm,
}: RoomConfigDialogProps) {
  const [rounds, setRounds] = useState(3);
  const [waitTime, setWaitTime] = useState(3);

  const handleConfirm = () => {
    onConfirm({ rounds, waitTime });
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6">
        <h2 className="text-3xl font-game text-center mb-6">Configure Room</h2>

        {/* Rounds Selection */}
        <div>
          <label className="block text-xl font-game mb-3">Rounds</label>
          <div className="flex gap-2">
            {[3, 5, 7].map((num) => (
              <button
                key={num}
                onClick={() => setRounds(num)}
                className={`flex-1 p-3 rounded-lg border-2 font-game text-lg transition-all ${
                  rounds === num
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white border-gray-300 hover:border-blue-300"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Wait Time Selection */}
        <div>
          <label className="block text-xl font-game mb-3">
            Wait Time (seconds)
          </label>
          <div className="flex gap-2">
            {[3, 5].map((num) => (
              <button
                key={num}
                onClick={() => setWaitTime(num)}
                className={`flex-1 p-3 rounded-lg border-2 font-game text-lg transition-all ${
                  waitTime === num
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white border-gray-300 hover:border-blue-300"
                }`}
              >
                {num}s
              </button>
            ))}
          </div>
        </div>

        {/* Confirm Button */}
        <Button onClick={handleConfirm} className="bg-green-500 text-white">
          Start Game
        </Button>
      </div>
    </Dialog>
  );
}
