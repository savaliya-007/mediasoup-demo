import { useState } from "react";
import { socket } from "../socket";
import { loadDevice } from "../mediasoup";

export default function SpeakerRoom() {
  const [room, setRoom] = useState("");

  const start = async () => {
    
    const newRoom = Math.floor(1000 + Math.random() * 9000).toString();
    setRoom(newRoom);

    socket.emit("join", { roomId: newRoom, role: "speaker" });

    socket.emit("rtpCapabilities", null, async (caps) => {
      const device = await loadDevice(caps);

      socket.emit("createTransport", null, async (params) => {
        const transport = device.createSendTransport(params);

        transport.on("connect", ({ dtlsParameters }, cb) => {
          socket.emit("connectTransport", { dtlsParameters });
          cb();
        });

        transport.on("produce", ({ kind, rtpParameters }, cb) => {
          socket.emit("produce", { kind, rtpParameters }, cb);
        });

        let track;

        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          track = stream.getAudioTracks()[0];
        } catch {
          // oscillator fallback
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          osc.start();
          const dest = ctx.createMediaStreamDestination();
          osc.connect(dest);
          track = dest.stream.getAudioTracks()[0];
        }

        await transport.produce({ track });
        console.log("Producing audio...");
      });
    });
  };

  return (
    <div className="box">
      <h2>Room Code: {room || "----"}</h2>

      <button
        disabled={!room}
        onClick={() => navigator.clipboard.writeText(room)}
      >
        Copy Code
      </button>

      <button onClick={start} style={{ marginTop: 20 }}>
        Start Speaking
      </button>
    </div>
  );
}
