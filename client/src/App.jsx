import { useState } from "react";
import Home from "./pages/Home";
import SpeakerRoom from "./pages/SpeakerRoom";
import ListenerRoom from "./pages/ListenerRoom";

export default function App() {
  const [page, setPage] = useState("home");
  const [room, setRoom] = useState("");

  const navigate = (role, code = "") => {
    setRoom(code);
    setPage(role);
  };

  if (page === "speaker") return <SpeakerRoom />;
  if (page === "listener") return <ListenerRoom room={room} />;
  return <Home navigate={navigate} />;
}
