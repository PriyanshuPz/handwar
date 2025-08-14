import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Room from "./components/Room";
import Test from "./components/Test";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room" element={<Room />} />
        <Route path="/test" element={<Test />} />
      </Routes>
    </Router>
  );
}
