import { Route, Routes, Navigate } from "react-router-dom";
import Home from "./components/Home";
import { SinglePlayerRoom } from "./singleplayer";
import { MultiplayerLobby, MultiplayerRoom } from "./multiplayer";
import { useOnlineLobbyStore } from "./store/onlineLobbyStore";

function App() {
  const { roomInstance } = useOnlineLobbyStore();

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/room" element={<SinglePlayerRoom />} />
      <Route path="/multiplayer" element={<MultiplayerLobby />} />
      <Route
        path="/multiplayer/room"
        element={
          roomInstance ? <MultiplayerRoom /> : <Navigate to="/multiplayer" />
        }
      />
    </Routes>
  );
}

export default App;
