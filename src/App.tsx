import { Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import { SinglePlayerRoom } from "./singleplayer";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/room" element={<SinglePlayerRoom />} />
    </Routes>
  );
}

export default App;
