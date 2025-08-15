import { CheckCircle, XCircle, MinusCircle } from "lucide-react";

type RoundResult = "win" | "loss" | "draw" | null;

interface RoundIndicatorsProps {
  roundHistory: RoundResult[];
  perspective: "player" | "computer";
  totalRounds: number;
}

export function RoundIndicators({
  roundHistory,
  perspective,
  totalRounds,
}: RoundIndicatorsProps) {
  const getIndicator = (result: RoundResult) => {
    if (result === null) {
      return <MinusCircle className="text-gray-300" size={24} />;
    }

    const playerPerspectiveResult =
      perspective === "player" ? result : invertResult(result);

    switch (playerPerspectiveResult) {
      case "win":
        return <CheckCircle className="text-green-500" size={24} />;
      case "loss":
        return <XCircle className="text-red-500" size={24} />;
      case "draw":
        return <CheckCircle className="text-yellow-500" size={24} />;
    }
  };

  const invertResult = (result: RoundResult): RoundResult => {
    if (result === "win") return "loss";
    if (result === "loss") return "win";
    return "draw";
  };

  const indicators = [];
  for (let i = 0; i < totalRounds; i++) {
    indicators.push(
      <div key={i} className="p-1">
        {getIndicator(roundHistory[i] || null)}
      </div>
    );
  }

  return <div className="flex justify-center my-2">{indicators}</div>;
}
