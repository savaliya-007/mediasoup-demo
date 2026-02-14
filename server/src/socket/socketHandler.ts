import { Server, Socket } from "socket.io";
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

import { initSpeech, pushAudioChunk } from "../services/speech.service";

// ---------- TYPES ----------
type JoinPayload = {
  roomId: string;
  role: "speaker" | "listener";
  name: string;
};

type CapsCb = (caps: unknown | null) => void;
type ParamsCb = (params: unknown | null) => void;
type ProduceCb = (data: { id: string } | null) => void;
type ConsumeCb = (data: unknown | null) => void;
type AckCb = (ok: boolean) => void;

export const socketHandler = (io: Server) => {
  // ---------- AZURE INIT ----------
  initSpeech(io);

  io.on("connection", (socket: Socket) => {
    console.info("User connected:", socket.id);

    // ---------- JOIN ----------
    socket.on("join", ({ roomId, role, name }: JoinPayload) => {
      if (!roomId) return;

      if (!getRoom(roomId)) createRoom(roomId);

      socket.data.roomId = roomId;
      socket.join(roomId);

      addUser(roomId, { socketId: socket.id, name, role });

      io.to(roomId).emit("room:users", getUsers(roomId));
      io.to(roomId).emit("room:count", getListenerCount(roomId));
    });

    // ---------- RTP CAPS ----------
    socket.on("rtpCapabilities", (_: unknown, cb: CapsCb) => {
      if (!router) return cb(null);
      cb(router.rtpCapabilities);
    });

    socket.on("setCaps", (caps: unknown) => {
      socket.data.caps = caps;
    });

    // ---------- CREATE TRANSPORT ----------
    socket.on("createTransport", async (_: unknown, cb: ParamsCb) => {
      try {
        const { transport, params } = await createTransport();
        socket.data.transport = transport;
        cb(params);
      } catch (err) {
        console.error("Create transport error:", err);
        cb(null);
      }
    });

    // ---------- CONNECT TRANSPORT (ACK REQUIRED) ----------
    socket.on(
      "connectTransport",
      async ({ dtlsParameters }: { dtlsParameters: unknown }, cb?: AckCb) => {
        try {
          const transport = socket.data.transport;
          if (!transport) {
            cb?.(false);
            return;
          }

          await transport.connect({ dtlsParameters });
          cb?.(true);
        } catch (err) {
          console.error("Transport connect error:", err);
          cb?.(false);
        }
      },
    );

    // ---------- PRODUCE ----------
    socket.on(
      "produce",
      async (
        { kind, rtpParameters }: { kind: string; rtpParameters: unknown },
        cb: ProduceCb,
      ) => {
        try {
          const transport = socket.data.transport;
          const roomId: string | undefined = socket.data.roomId;

          if (!transport || !roomId) return cb(null);

          const room = getRoom(roomId);
          if (!room) return cb(null);

          const producer = await transport.produce({
            kind,
            rtpParameters,
          });

          room.producer = producer;

          io.to(roomId).emit("new-producer");

          cb({ id: producer.id });
        } catch (err) {
          console.error("Produce error:", err);
          cb(null);
        }
      },
    );

    // ---------- CONSUME ----------
    socket.on("consume", async (_: unknown, cb: ConsumeCb) => {
      try {
        const transport = socket.data.transport;
        const roomId: string | undefined = socket.data.roomId;
        const caps = socket.data.caps;

        if (!transport || !roomId || !caps) return cb(null);

        const room = getRoom(roomId);
        if (!room?.producer) return cb(null);

        const consumer = await transport.consume({
          producerId: room.producer.id,
          rtpCapabilities: caps,
          paused: false,
        });

        await consumer.resume();

        cb({
          id: consumer.id,
          producerId: room.producer.id,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
        });
      } catch (err) {
        console.error("Consume error:", err);
        cb(null);
      }
    });

    // ---------- SPEECH AUDIO ----------
    socket.on("audioChunk", (data: Uint8Array) => {
      if (!data || data.byteLength === 0) return;
      pushAudioChunk(data);
    });

    // ---------- LEAVE ----------
    const leave = () => {
      const roomId: string | undefined = socket.data.roomId;
      if (!roomId) return;

      removeUser(roomId, socket.id);

      io.to(roomId).emit("room:users", getUsers(roomId));
      io.to(roomId).emit("room:count", getListenerCount(roomId));

      console.info("User left:", socket.id);
    };

    socket.on("leave", leave);
    socket.on("disconnect", leave);
  });
};
