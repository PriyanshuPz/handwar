import { Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import MultiplayerRoom from "./components/MultiplayerRoom";
import { SinglePlayerRoom } from "./singleplayer";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/room/:roomId" element={<MultiplayerRoom />} />
      <Route path="/room" element={<SinglePlayerRoom />} />
    </Routes>
  );
}

export default App;
