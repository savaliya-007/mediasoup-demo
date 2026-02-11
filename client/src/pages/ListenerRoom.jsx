import { useEffect, useRef } from "react";
import { socket } from "../socket";
import { loadDevice } from "../mediasoup";

export default function ListenerRoom({ room }) {
  const audioRef = useRef();

  useEffect(() => {
    socket.emit("join", { roomId: room, role: "listener" });

    socket.emit("rtpCapabilities", null, async (caps) => {
      const device = await loadDevice(caps);

      socket.emit("setCaps", device.rtpCapabilities);

      socket.emit("createTransport", null, async (params) => {
        const transport = device.createRecvTransport(params);

        transport.on("connect", ({ dtlsParameters }, cb) => {
          socket.emit("connectTransport", { dtlsParameters });
          cb();
        });

        socket.emit("consume", null, async (consumerParams) => {
          if (!consumerParams) return console.log("No consumer");

          const consumer = await transport.consume(consumerParams);

          const stream = new MediaStream();
          stream.addTrack(consumer.track);

          audioRef.current.srcObject = stream;

          consumer.track.onunmute = () => console.log("Audio packets arriving");

          console.log("Consuming...");
        });
      });
    });
  }, []);

  return (
    <div className="box">
      <h2>Listening Room {room}</h2>
      <audio ref={audioRef} autoPlay />
    </div>
  );
}
