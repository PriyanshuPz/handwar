import { Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import MultiplayerRoom from "./components/MultiplayerRoom";
import { SinglePlayerRoom } from "./singleplayer";
import { MultiplayerRoom as MatchmakingRoom } from "./multiplayer/matchmaking";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/room/:roomId" element={<MultiplayerRoom />} />
      <Route path="/room" element={<SinglePlayerRoom />} />
      <Route path="/multiplayer/:roomId" element={<MatchmakingRoom />} />
    </Routes>
  );
}

export default App;
