import { useEffect, useRef, useState } from "react";
import { socket } from "../services/socket";
import { loadDevice } from "../services/mediasoup";
import Avatar from "../components/Avatar";

export default function ListenerRoom({ room, name }) {
  const audioRef = useRef(null);
  const transportRef = useRef(null);
  const consumerRef = useRef(null);

  const [count, setCount] = useState(0);
  const [users, setUsers] = useState([]);
  const [speechText, setSpeechText] = useState("");

  useEffect(() => {
    if (!room) return;

    const audioEl = audioRef.current;

    socket.emit("join", { roomId: room, role: "listener", name });

    const onCount = (val) => setCount(val ?? 0);
    const onUsers = (list) => setUsers(list ?? []);
    const onSpeech = (text) => {
      if (!text) return;
      setSpeechText(text);
    };

    socket.on("room:count", onCount);
    socket.on("room:users", onUsers);
    socket.on("speechText", onSpeech);

    // ---------- CONSUME AUDIO ----------
    const consumeAudio = () => {
      const transport = transportRef.current;
      if (!transport || !audioEl) return;

      socket.emit("consume", null, async (params) => {
        if (!params) return;

        try {
          consumerRef.current?.close();

          const consumer = await transport.consume(params);
          consumerRef.current = consumer;

          const stream = new MediaStream();
          stream.addTrack(consumer.track);

          audioEl.srcObject = stream;

          try {
            await audioEl.play();
          } catch {
            console.warn("Autoplay blocked");
          }
        } catch (err) {
          console.error("Consume audio error:", err);
        }
      });
    };

    // ---------- INIT ----------
    const init = async () => {
      try {
        socket.emit("rtpCapabilities", null, async (caps) => {
          if (!caps) return;

          const device = await loadDevice(caps);

          socket.emit("setCaps", device.rtpCapabilities);

          socket.emit("createTransport", null, async (params) => {
            if (!params) return;

            const transport = device.createRecvTransport(params);
            transportRef.current = transport;

            transport.on("connect", ({ dtlsParameters }, cb, errCb) => {
              socket.emit("connectTransport", { dtlsParameters }, (ok) => {
                if (!ok) return errCb?.(new Error("Transport connect failed"));
                cb();
              });
            });

            consumeAudio();
          });
        });
      } catch (err) {
        console.error("Listener init error:", err);
      }
    };

    init();

    socket.on("new-producer", consumeAudio);

    // ---------- CLEANUP ----------
    return () => {
      try {
        consumerRef.current?.close();
        transportRef.current?.close();
      } catch {
        console.warn("Cleanup warning");
      }

      socket.emit("leave", { roomId: room });

      socket.off("room:count", onCount);
      socket.off("room:users", onUsers);
      socket.off("speechText", onSpeech);
      socket.off("new-producer", consumeAudio);
    };
  }, [room, name]);

  const speaker = users.find((u) => u.role === "speaker");
  const listeners = users.filter((u) => u.role === "listener");

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center gap-8">
      <div className="bg-gray-900 px-4 py-2 rounded-xl border border-gray-700 shadow">
        {room} — {count} Listening
      </div>

      {speaker && (
        <div className="flex flex-col items-center gap-3 p-6 rounded-2xl shadow-xl w-72">
          <h2 className="text-lg font-semibold text-green-400">Speaker</h2>
          <Avatar name={speaker.name} />
        </div>
      )}

      {/* ---------- LIVE SUBTITLE ---------- */}
      <div className="bg-gray-800 px-6 py-3 rounded-lg text-lg text-yellow-300 min-h-10 w-full max-w-lg text-center">
        {speechText || "Waiting for speech..."}
      </div>

      <div className="w-full max-w-3xl">
        <h2 className="text-lg font-semibold mb-4 text-blue-400 text-center">
          Participants
        </h2>

        <div className="grid grid-cols-3 gap-6 justify-items-center">
          {listeners.map((u, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Avatar name={u.name} />
              <p className="text-sm">{u.name}</p>
            </div>
          ))}
        </div>
      </div>

      <audio ref={audioRef} autoPlay playsInline className="hidden" />
    </div>
  );
}
