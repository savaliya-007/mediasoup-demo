import { useEffect, useRef } from "react";
import { socket } from "../socket";
import { loadDevice } from "../mediasoup";

export default function ListenerRoom({ room }) {
  const audioRef = useRef();

  useEffect(() => {
    if (!room) return;

    const audioEl = audioRef.current;

    let transport;
    let consumer;

    socket.emit("join", { roomId: room, role: "listener" });

    socket.emit("rtpCapabilities", null, async (caps) => {
      const device = await loadDevice(caps);

      socket.emit("setCaps", device.rtpCapabilities);

      socket.emit("createTransport", null, async (params) => {
        transport = device.createRecvTransport(params);

        transport.on("connect", ({ dtlsParameters }, cb) => {
          socket.emit("connectTransport", { dtlsParameters });
          cb();
        });
        socket.emit("consume", null, async (consumerParams) => {
          if (!consumerParams) return;
          
          consumer = await transport.consume(consumerParams);

          console.log("Consuming started");
          
          const stream = new MediaStream();
          stream.addTrack(consumer.track);
          
          if (audioEl) {
            audioEl.srcObject = stream;
          }
        });
      });
    });

    return () => {
      consumer?.close();
      transport?.close();

      if (audioEl) {
        audioEl.srcObject = null;
      }

      socket.emit("leave", { roomId: room });
    };
  }, [room]);



  return (
    <div className="box">
      <h2>Listening Room {room}</h2>
      <audio ref={audioRef} autoPlay />
    </div>
  );
}
