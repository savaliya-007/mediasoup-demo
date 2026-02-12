import { useState } from "react";
import Home from "./pages/Home";
import ListenerRoom from "./pages/ListenerRoom";
import SpeakerRoom from "./pages/SpeakerRoom";

export default function App() {
  const [view, setView] = useState("home");
  const [user, setUser] = useState("");
  const [room, setRoom] = useState("");

  if (view === "listener") {
    return <ListenerRoom room={room} name={user} />;
  }

  if (view === "speaker") {
    return <SpeakerRoom room={room} name={user} />;
  }

  return (
    <Home
      setView={setView}
      setUser={setUser} // IMPORTANT
      setRoom={setRoom} // IMPORTANT
    />
  );
}
