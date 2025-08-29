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
  isMultiplayer?: boolean;
  isHost?: boolean;
  opponentName?: string;
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
  isMultiplayer = false,
  isHost = false,
  opponentName = "Opponent",
}: GameResultDialogProps) {
  const getResultMessage = () => {
    if (gameWinner === "player") return " You Won!";
    if (gameWinner === "opponent" || gameWinner === "computer")
      return "You Lost!";
    return "It's a Draw!";
  };

  const getResultColor = () => {
    if (gameWinner === "player") return "text-green-600";
    if (gameWinner === "opponent" || gameWinner === "computer")
      return "text-red-600";
    return "text-yellow-600";
  };

  const getResultDescription = () => {
    if (gameWinner === "player")
      return "Congratulations! You dominated the battlefield!";
    if (gameWinner === "opponent" || gameWinner === "computer")
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
            <span
              className={
                gameWinner === "opponent" || gameWinner === "computer"
                  ? "text-red-600"
                  : ""
              }
            >
              {isMultiplayer ? opponentName : "Computer"}: {computerScore}
            </span>
          </div>
          <p className="text-sm text-gray-600">Best of {totalRounds} rounds</p>
        </div>

        <div className="space-y-3">
          {!isMultiplayer || isHost ? (
            <Button onClick={onReplay} variant="blue">
              Play Again
            </Button>
          ) : (
            <p className="text-sm text-gray-600 italic">
              Waiting for host to start a new game...
            </p>
          )}
          <Button onClick={onGoHome}>
            {isMultiplayer ? "Leave Room" : "Home"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
