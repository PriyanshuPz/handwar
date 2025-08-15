import Rock from "../assets/icons/rock.png";
import Paper from "../assets/icons/paper.png";
import Scissors from "../assets/icons/scissors.png";
import type { Choice } from "../hooks/useGameLogic";

export function RockIcon() {
  return <img src={Rock} alt="Rock" />;
}

export function PaperIcon() {
  return <img src={Paper} alt="Paper" />;
}

export function ScissorsIcon() {
  return <img src={Scissors} alt="Scissors" />;
}

export function ElementIcon({ element }: { element: Choice }) {
  const icons = {
    rock: <RockIcon />,
    paper: <PaperIcon />,
    scissors: <ScissorsIcon />,
  };

  return <div className="w-20 h-20">{icons[element]}</div>;
}
