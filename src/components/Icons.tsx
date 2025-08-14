import Rock from "../../public/assets/icons/rock.png";
import Paper from "../../public/assets/icons/paper.png";
import Scissors from "../../public/assets/icons/scissors.png";
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

  return <div className="w-12 h-12">{icons[element]}</div>;
}
