import { useEffect, useRef, useState } from "react";
import { socket } from "../services/socket";
import { loadDevice } from "../services/mediasoup";
import Avatar from "../components/Avatar";
import {Check,Copy} from 'lucide-react'
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";

export default function SpeakerRoom({ name }) {
  const [room] = useState(() =>
    Math.floor(1000 + Math.random() * 9000).toString(),
  );
  const [count, setCount] = useState(0);
  const [users, setUsers] = useState([]);
  const [copied, setCopied] = useState(false);
  const [micOn, setMicOn] = useState(false);

  const transportRef = useRef(null);
  const producerRef = useRef(null);
  const trackRef = useRef(null);

  // JOIN ONLY ONCE
  useEffect(() => {
    socket.emit("join", { roomId: room, role: "speaker", name });

    socket.on("room:count", setCount);
    socket.on("room:users", setUsers);

    return () => {
      socket.emit("leave", { roomId: room });
      socket.off("room:count");
      socket.off("room:users");
    };
  }, []);

  const copyCode = async () => {
    await navigator.clipboard.writeText(room);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const startProducing = async () => {
    socket.emit("rtpCapabilities", null, async (caps) => {
      const device = await loadDevice(caps);

      socket.emit("createTransport", null, async (params) => {
        const transport = device.createSendTransport(params);
        transportRef.current = transport;

        transport.on("connect", ({ dtlsParameters }, cb) => {
          socket.emit("connectTransport", { dtlsParameters });
          cb();
        });

        transport.on("produce", ({ kind, rtpParameters }, cb) => {
          socket.emit("produce", { kind, rtpParameters }, cb);
        });

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        const track = stream.getAudioTracks()[0];
        trackRef.current = track;

        const producer = await transport.produce({ track });
        producerRef.current = producer;
      });
    });
  };

  const toggleMic = async () => {
    if (micOn) {
      trackRef.current?.stop();
      producerRef.current?.close();
      setMicOn(false);
      return;
    }

    setMicOn(true);
    startProducing();
  };

  // ---------- SPLIT USERS ----------
  const listeners = users.filter((u) => u.role === "listener");

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center gap-8">
      {/* HEADER */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 flex items-center gap-3 shadow">
        <span className="font-mono text-lg">{room}</span>

        <button
          onClick={copyCode}
          className="text-xs bg-gray-700 px-2 py-1 rounded"
        >
          {copied ? <Check size={15}/> : <Copy size={15}/>}
        </button>

        <div className="text-blue-400 bg-blue-900/30 px-3 py-1 rounded-full text-sm">
          {count} Listeners
        </div>

        {micOn && (
          <span className="text-green-400 text-xs animate-pulse">LIVE</span>
        )}
      </div>

      {/* SPEAKER CARD */}
      <div className="flex flex-col items-center gap-3 rounded-2xl shadow-xl w-72">
        <h2 className="text-lg font-semibold text-green-400">Speaker</h2>
        <Avatar name={name} />
        <p className="text-lg font-medium">{name} (you)</p>
      </div>

      {/* MIC BUTTON */}
      <button
        onClick={toggleMic}
        className={`p-4 rounded-full ${micOn ? "bg-red-600" : "bg-green-600"}`}
      >
        {micOn ? <FaMicrophoneSlash size={22} /> : <FaMicrophone size={22} />}
      </button>

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
    </div>
  );
}
