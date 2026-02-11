import { Server } from "socket.io";
import { createTransport } from "../mediasoup/transport";
import { router } from "../mediasoup/router";
import { getRoom } from "../rooms/roomManager";

export const socketHandler = (io: Server) => {
  io.on("connection", (socket) => {
    console.log("Client Connected:", socket.id);

    socket.on("join", ({ roomId, role }) => {
      socket.data.roomId = roomId;
      socket.data.role = role;
      console.log("Joined:", role, roomId);
    });

    socket.on("rtpCapabilities", (_, cb) => cb(router.rtpCapabilities));

    socket.on("setCaps", (caps) => (socket.data.caps = caps));

    socket.on("createTransport", async (_, cb) => {
      const t = await createTransport();
      socket.data.transport = t;
      cb({
        id: t.id,
        iceParameters: t.iceParameters,
        iceCandidates: t.iceCandidates,
        dtlsParameters: t.dtlsParameters,
      });
    });

    socket.on("connectTransport", async ({ dtlsParameters }) => {
      await socket.data.transport.connect({ dtlsParameters });
    });

    socket.on("produce", async ({ kind, rtpParameters }, cb) => {
      if (socket.data.role !== "speaker") return;
      const producer = await socket.data.transport.produce({
        kind,
        rtpParameters,
      });
      getRoom(socket.data.roomId).producer = producer;
      console.log("Producer:", producer.id);
      cb(producer.id);
    });

    socket.on("consume", async (_, cb) => {
      const room = getRoom(socket.data.roomId);
      if (!room.producer) return console.log("No producer");

      const consumer = await socket.data.transport.consume({
        producerId: room.producer.id,
        rtpCapabilities: socket.data.caps,
        paused: false,
      });

      console.log("Consumer:", consumer.id);

      cb({
        id: consumer.id,
        producerId: room.producer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      });
    });
  });
};
