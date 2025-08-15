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
  onChoiceSelect,
  disabled = false,
}: ActionButtonsProps) {
  const choices: Choice[] = ["rock", "paper", "scissors"];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="flex justify-center space-x-6 py-4 -mt-10"
      >
        {choices.map((choice) => (
          <Button
            key={choice}
            onClick={() => onChoiceSelect(choice)}
            disabled={disabled}
            variant="default"
            className="w-20 h-20 bg-white p-2 pt-6 flex items-center justify-center"
          >
            <ElementIcon element={choice} />
          </Button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
