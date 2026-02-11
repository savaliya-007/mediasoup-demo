import { useState } from "react";

export default function Home({ navigate }) {
  const [code, setCode] = useState("");

  return (
    <div className="box">
      <h1>Audio Broadcast</h1>

      <button onClick={() => navigate("speaker")}>Start Broadcast</button>

      <div style={{ marginTop: 20 }}>
        <input
          placeholder="Enter Room Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button onClick={() => navigate("listener", code)}>Join</button>
      </div>
    </div>
  );
}
