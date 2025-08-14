import { motion, AnimatePresence } from "framer-motion";
import type { Choice } from "../../hooks/useGameLogic";
import { Button } from "../ui/button";
import { ElementIcon } from "../Icons";

interface ActionButtonsProps {
  isVisible: boolean;
  onChoiceSelect: (choice: Choice) => void;
  disabled?: boolean;
}

export function ActionButtons({
  isVisible,
  onChoiceSelect,
  disabled = false,
}: ActionButtonsProps) {
  const choices: Choice[] = ["rock", "paper", "scissors"];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="flex justify-center space-x-6"
        >
          {choices.map((choice) => (
            <Button
              onClick={() => onChoiceSelect(choice)}
              disabled={disabled}
              variant="icon"
              className="w-14 h-14 flex items-center justify-center"
            >
              <ElementIcon element={choice} />
            </Button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
