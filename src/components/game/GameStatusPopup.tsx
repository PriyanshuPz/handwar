import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface GameStatusPopupProps {
  isVisible: boolean;
  children: React.ReactNode;
  variant?: "default" | "countdown" | "result";
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function GameStatusPopup({
  isVisible,
  children,
  variant = "default",
  onClose,
  showCloseButton = false,
}: GameStatusPopupProps) {
  const getPopupStyles = () => {
    switch (variant) {
      case "countdown":
        return "bg-white border-4 border-black";
      case "result":
        return "bg-white border-4 border-black";
      default:
        return "bg-white border-4 border-black";
    }
  };

  const getContainerStyles = () => {
    switch (variant) {
      case "countdown":
        return "items-center justify-center";
      default:
        return "items-center justify-center";
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed z-40 flex ${getContainerStyles()}`}
          style={{
            top: variant === "countdown" ? "50%" : "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: variant === "countdown" ? "none" : "auto",
          }}
        >
          {/* Popup container */}
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.8,
              y: variant === "countdown" ? 0 : 20,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.8,
              y: variant === "countdown" ? 0 : 20,
            }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              mass: 0.8,
            }}
            className="relative"
          >
            {variant === "countdown" && (
              <div className="absolute inset-0 bg-gray-200 rounded-2xl blur-lg scale-110" />
            )}

            <div
              className={`
              relative rounded-2xl p-6 min-w-0 max-w-md w-full
              shadow-[0_8px_0px_0px_#000]
              ${getPopupStyles()}
              ${variant === "countdown" ? "text-center" : ""}
            `}
            >
              {showCloseButton && onClose && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  onClick={onClose}
                  className="absolute top-3 right-3 p-2 hover:bg-gray-100 rounded-full transition-all duration-200 text-gray-600 hover:text-black"
                >
                  <X size={18} />
                </motion.button>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {children}
              </motion.div>

              {/* Decorative elements */}
              <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-black rounded-full" />
              <div className="absolute top-3 right-12 w-1 h-1 bg-gray-400 rounded-full" />
              <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-black rounded-full" />
              <div className="absolute bottom-3 left-3 w-1 h-1 bg-gray-400 rounded-full" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
