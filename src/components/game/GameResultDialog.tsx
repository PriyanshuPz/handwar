import { Button } from "../ui/button";
import { Dialog } from "../ui/Dialog";

interface GameResultDialogProps {
  isOpen: boolean;
  onClose: () => void;
  gameWinner: string | null;
  playerScore: number;
  computerScore: number;
  totalRounds: number;
  onReplay: () => void;
  onGoHome: () => void;
}

export function GameResultDialog({
  isOpen,
  onClose,
  gameWinner,
  playerScore,
  computerScore,
  totalRounds,
  onReplay,
  onGoHome,
}: GameResultDialogProps) {
  const getResultMessage = () => {
    if (gameWinner === "player") return " You Won!";
    if (gameWinner === "computer") return "You Lost!";
    return "It's a Draw!";
  };

  const getResultColor = () => {
    if (gameWinner === "player") return "text-green-600";
    if (gameWinner === "computer") return "text-red-600";
    return "text-yellow-600";
  };

  const getResultDescription = () => {
    if (gameWinner === "player")
      return "Congratulations! You dominated the battlefield!";
    if (gameWinner === "computer")
      return "Better luck next time! Keep practicing!";
    return "Great match! You're evenly matched!";
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} closeButton={false}>
      <div className="text-center space-y-6">
        <h2 className={`text-4xl font-game ${getResultColor()}`}>
          {getResultMessage()}
        </h2>

        <p className="text-gray-600 font-medium">{getResultDescription()}</p>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <p className="text-xl font-game">Final Score</p>
          <div className="flex justify-between text-lg font-semibold">
            <span className={gameWinner === "player" ? "text-green-600" : ""}>
              You: {playerScore}
            </span>
            <span className={gameWinner === "computer" ? "text-red-600" : ""}>
              Computer: {computerScore}
            </span>
          </div>
          <p className="text-sm text-gray-600">Best of {totalRounds} rounds</p>
        </div>

        <div className="space-y-3">
          <Button onClick={onReplay} variant="blue">
            Play Again
          </Button>
          <Button onClick={onGoHome}>Home</Button>
        </div>
      </div>
    </Dialog>
  );
}
