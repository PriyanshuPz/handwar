import { Button, Dialog } from "../../components/ui";
import { useSinglePlayerGameStore } from "../store/gameStore";

interface Props {
  isDialogOpen: boolean;
  onClose: () => void;
  handleConfirm: () => void;
}

export default function SinglePlayerRoomConfigDialog({
  isDialogOpen,
  onClose,
  handleConfirm,
}: Props) {
  const { config, setConfig } = useSinglePlayerGameStore();

  return (
    <Dialog isOpen={isDialogOpen} onClose={onClose} title="Configure Room">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Number of Rounds
          </label>
          <div className="flex gap-3">
            {([3, 5, 7] as const).map((round) => (
              <button
                key={round}
                onClick={() =>
                  setConfig({ rounds: round, waitTime: config.waitTime })
                }
                className={`px-6 py-3 rounded-lg border-2 font-medium transition-all ${
                  config.rounds === round
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
                onClick={() =>
                  setConfig({
                    waitTime: time,
                    rounds: config.rounds,
                  })
                }
                className={`px-6 py-3 rounded-lg border-2 font-medium transition-all ${
                  config.waitTime === time
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
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleConfirm} variant="blue">
            Confirm
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
