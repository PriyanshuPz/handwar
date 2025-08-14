import { HandSprite } from "./game";

export default function Test() {
  return (
    <div className="min-h-screen bg-primary p-6 flex flex-col justify-center items-center text-white">
      <HandSprite animation="scissors" isPlayer />
    </div>
  );
}
