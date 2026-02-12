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

  useEffect(() => {
    if (!room) return;

    const audioEl = audioRef.current;

    socket.emit("join", { roomId: room, role: "listener", name });

    socket.on("room:count", setCount);
    socket.on("room:users", setUsers);

    const consumeAudio = () => {
      const transport = transportRef.current;
      if (!transport) return;

      socket.emit("consume", null, async (params) => {
        if (!params) return;

        consumerRef.current?.close();

        const consumer = await transport.consume(params);
        consumerRef.current = consumer;

        const stream = new MediaStream();
        stream.addTrack(consumer.track);

        audioEl.srcObject = stream;
        audioEl.play().catch(() => {});
      });
    };

    const init = async () => {
      socket.emit("rtpCapabilities", null, async (caps) => {
        const device = await loadDevice(caps);

        socket.emit("setCaps", device.rtpCapabilities);

        socket.emit("createTransport", null, async (params) => {
          const transport = device.createRecvTransport(params);
          transportRef.current = transport;

          transport.on("connect", ({ dtlsParameters }, cb) => {
            socket.emit("connectTransport", { dtlsParameters });
            cb();
          });

          consumeAudio();
        });
      });
    };

    init();

    socket.on("new-producer", consumeAudio);

    return () => {
      consumerRef.current?.close();
      transportRef.current?.close();
      socket.emit("leave", { roomId: room });

      socket.off("room:count");
      socket.off("room:users");
      socket.off("new-producer");
    };
  }, [room]);

  // ---------- SPLIT USERS ----------
  const speaker = users.find((u) => u.role === "speaker");
  const listeners = users.filter((u) => u.role === "listener");

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center gap-8">
      {/* HEADER */}
      <div className="bg-gray-900 px-4 py-2 rounded-xl border border-gray-700 shadow">
        {room} — {count} Listening
      </div>

      {/* SPEAKER CARD */}
      {speaker && (
        <div className="flex flex-col items-center gap-3 p-6 rounded-2xl shadow-xl w-72">
          <h2 className="text-lg font-semibold text-green-400">Speaker</h2>
          <Avatar name={speaker.name} />
        </div>
      )}

      {/* PARTICIPANTS GRID */}
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
