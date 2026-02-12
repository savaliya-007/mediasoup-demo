import { Server } from "socket.io";
import { createTransport } from "../mediasoup/transport";
import { router } from "../mediasoup/router";
import {
  getRoom,
  createRoom,
  addUser,
  removeUser,
  getListenerCount,
  getUsers,
} from "../rooms/roomManager";

export const socketHandler = (io: Server) => {
  io.on("connection", (socket) => {
    // ---------- JOIN ----------
    socket.on("join", ({ roomId, role, name }) => {
      if (!getRoom(roomId)) createRoom(roomId);

      socket.data.roomId = roomId;
      socket.join(roomId);

      addUser(roomId, { socketId: socket.id, name, role });

      io.to(roomId).emit("user:joined", name);
      io.to(roomId).emit("room:users", getUsers(roomId));
      io.to(roomId).emit("room:count", getListenerCount(roomId));
    });

    // ---------- RTP CAPS ----------
    socket.on("rtpCapabilities", (_, cb) => {
      if (!router) return cb(null);
      cb(router.rtpCapabilities);
    });

    socket.on("setCaps", (caps) => {
      socket.data.caps = caps;
    });

    // ---------- TRANSPORT ----------
    socket.on("createTransport", async (_, cb) => {
      try {
        const { transport, params } = await createTransport();
        socket.data.transport = transport;
        cb(params);
      } catch {
        cb(null);
      }
    });

    socket.on("connectTransport", async ({ dtlsParameters }) => {
      try {
        await socket.data.transport.connect({ dtlsParameters });
      } catch {}
    });

    // ---------- PRODUCE ----------
    socket.on("produce", async ({ kind, rtpParameters }, cb) => {
      try {
        const producer = await socket.data.transport.produce({
          kind,
          rtpParameters,
        });

        const room = getRoom(socket.data.roomId);
        if (!room) return cb(null);

        room.producer = producer;

        // mic toggle fix
        io.to(socket.data.roomId).emit("new-producer");

        cb({ id: producer.id });
      } catch {
        cb(null);
      }
    });

    // ---------- CONSUME ----------
    socket.on("consume", async (_, cb) => {
      try {
        const room = getRoom(socket.data.roomId);
        if (!room?.producer) return cb(null);

        const consumer = await socket.data.transport.consume({
          producerId: room.producer.id,
          rtpCapabilities: socket.data.caps,
          paused: false,
        });

        await consumer.resume();

        cb({
          id: consumer.id,
          producerId: room.producer.id,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
        });
      } catch {
        cb(null);
      }
    });

    // ---------- LEAVE ----------
    const leave = () => {
      const { roomId } = socket.data;
      if (!roomId) return;

      removeUser(roomId, socket.id);

      io.to(roomId).emit("room:users", getUsers(roomId));
      io.to(roomId).emit("room:count", getListenerCount(roomId));
    };

    socket.on("leave", leave);
    socket.on("disconnect", leave);
  });
};
