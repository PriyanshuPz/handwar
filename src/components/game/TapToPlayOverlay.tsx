import { motion, AnimatePresence } from "framer-motion";

interface TapToPlayOverlayProps {
  isVisible: boolean;
  onTap: () => void;
}

export function TapToPlayOverlay({ isVisible, onTap }: TapToPlayOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer bg-black/20 backdrop-blur-sm"
          onClick={onTap}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 50 }}
            transition={{
              type: "spring",
              damping: 20,
              stiffness: 300,
              delay: 0.1,
            }}
            className="text-center select-none"
          >
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="mb-6"
            >
              <p className="text-lg text-gray-700 font-medium mb-4">
                Tap to Play
              </p>
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="text-sm text-gray-500"
              >
                Touch anywhere to start
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
