import { useEffect, useRef, useState } from "react";
import { socket } from "../services/socket";
import { loadDevice } from "../services/mediasoup";
import Avatar from "../components/Avatar";
import { Check, Copy } from "lucide-react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";

export default function SpeakerRoom({ name }) {
  const [room] = useState(() =>
    Math.floor(1000 + Math.random() * 9000).toString(),
  );
  const [count, setCount] = useState(0);
  const [users, setUsers] = useState([]);
  const [copied, setCopied] = useState(false);
  const [micOn, setMicOn] = useState(false);

  // 🔹 NEW SOURCE LANGUAGE STATE
  const [sourceLang, setSourceLang] = useState("en-US");

  const transportRef = useRef(null);
  const producerRef = useRef(null);
  const trackRef = useRef(null);

  const audioCtxRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);

  // ---------- CLEANUP ----------
  const cleanupAudio = () => {
    try {
      trackRef.current?.stop();
      producerRef.current?.close();
      transportRef.current?.close();

      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();

      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
      }
    } catch (err) {
      console.warn("Cleanup warning:", err?.message);
    }

    processorRef.current = null;
    audioCtxRef.current = null;
    sourceRef.current = null;
    trackRef.current = null;
    producerRef.current = null;
    transportRef.current = null;
  };

  // ---------- JOIN ----------
  useEffect(() => {
    socket.emit("join", { roomId: room, role: "speaker", name });

    // send initial language
    socket.emit("setSourceLang", sourceLang);

    socket.on("room:count", setCount);
    socket.on("room:users", setUsers);

    return () => {
      cleanupAudio();
      socket.emit("leave", { roomId: room });
      socket.off("room:count", setCount);
      socket.off("room:users", setUsers);
    };
  }, [room, name]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      console.warn("Clipboard failed");
    }
  };

  // ---------- DOWNSAMPLE ----------
  const downsampleBuffer = (buffer, sampleRate, outSampleRate) => {
    if (outSampleRate === sampleRate) return buffer;

    const ratio = sampleRate / outSampleRate;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);

    let offsetResult = 0;
    let offsetBuffer = 0;

    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
      let accum = 0;
      let count = 0;

      for (
        let i = offsetBuffer;
        i < nextOffsetBuffer && i < buffer.length;
        i++
      ) {
        accum += buffer[i];
        count++;
      }

      result[offsetResult] = accum / count;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }

    return result;
  };

  // ---------- FLOAT → PCM16 ----------
  const floatTo16BitPCM = (float32, inputRate) => {
    const downsampled = downsampleBuffer(float32, inputRate, 16000);

    const buffer = new ArrayBuffer(downsampled.length * 2);
    const view = new DataView(buffer);

    let offset = 0;
    for (let i = 0; i < downsampled.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, downsampled[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    return buffer;
  };

  // ---------- SPEECH STREAM ----------
  const startSpeechStream = async (stream) => {
    try {
      const audioCtx = new AudioContext({ latencyHint: "interactive" });
      audioCtxRef.current = audioCtx;

      if (!audioCtx.audioWorklet) return;

      await audioCtx.audioWorklet.addModule("/pcmProcessor.js");

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;

      const workletNode = new AudioWorkletNode(audioCtx, "pcm-processor");
      processorRef.current = workletNode;

      const sampleRate = audioCtx.sampleRate;

      workletNode.port.onmessage = (event) => {
        if (!event?.data) return;

        const pcmBuffer = floatTo16BitPCM(event.data, sampleRate);
        socket.emit("audioChunk", new Uint8Array(pcmBuffer));
      };

      source.connect(workletNode);
      workletNode.connect(audioCtx.destination);
    } catch (err) {
      console.error("Speech stream error:", err);
    }
  };

  // ---------- MEDIASOUP PRODUCE ----------
  const startProducing = async () => {
    try {
      socket.emit("rtpCapabilities", null, async (caps) => {
        if (!caps) return;

        const device = await loadDevice(caps);

        socket.emit("createTransport", null, async (params) => {
          if (!params) return;

          const transport = device.createSendTransport(params);
          transportRef.current = transport;

          transport.on("connect", ({ dtlsParameters }, cb, errCb) => {
            socket.emit("connectTransport", { dtlsParameters }, (ok) => {
              if (!ok) return errCb(new Error("Transport connect failed"));
              cb();
            });
          });

          transport.on("produce", ({ kind, rtpParameters }, cb, errCb) => {
            socket.emit("produce", { kind, rtpParameters }, (data) => {
              if (!data?.id)
                return errCb(new Error("Producer creation failed"));
              cb({ id: data.id });
            });
          });

          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });

          const track = stream.getAudioTracks()[0];
          trackRef.current = track;

          const producer = await transport.produce({ track });
          producerRef.current = producer;

          await startSpeechStream(stream);
        });
      });
    } catch (err) {
      console.error("Mediasoup produce error:", err);
    }
  };

  // ---------- MIC TOGGLE ----------
  const toggleMic = async () => {
    if (micOn) {
      cleanupAudio();
      setMicOn(false);
      return;
    }

    setMicOn(true);
    await startProducing();
  };

  const listeners = users.filter((u) => u.role === "listener");

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center gap-8">
      <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 flex items-center gap-3 shadow">
        <span className="font-mono text-lg">{room}</span>

        <button
          onClick={copyCode}
          className="text-xs bg-gray-700 px-2 py-1 rounded"
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
        </button>

        <div className="text-blue-400 bg-blue-900/30 px-3 py-1 rounded-full text-sm">
          {count} Listeners
        </div>

        {micOn && (
          <span className="text-green-400 text-xs animate-pulse">LIVE</span>
        )}
      </div>

      {/* 🔹 SOURCE LANGUAGE SELECT */}
      <select
        value={sourceLang}
        onChange={(e) => {
          const l = e.target.value;
          setSourceLang(l);
          socket.emit("setSourceLang", l);
        }}
        className="bg-gray-800 text-white p-2 rounded"
      >
        <option value="en-US">English</option>
        <option value="hi-IN">Hindi</option>
        <option value="gu-IN">Gujarati</option>
        <option value="es-ES">Spanish</option>
        <option value="fr-FR">French</option>
      </select>

      <div>
        <Avatar name={name} />
        <p className="text-lg font-medium mt-2 px-18">{name} (you)</p>
      </div>

      <button
        onClick={toggleMic}
        className={`p-4 rounded-full ${micOn ? "bg-red-600" : "bg-green-600"}`}
      >
        {micOn ? <FaMicrophoneSlash size={22} /> : <FaMicrophone size={22} />}
      </button>

      <div className="grid grid-cols-3 gap-6 justify-items-center">
        {listeners.map((u, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Avatar name={u.name} />
            <p className="text-sm">{u.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
